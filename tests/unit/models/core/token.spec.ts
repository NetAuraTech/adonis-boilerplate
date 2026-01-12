import { test } from '@japa/runner'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { UserFactory } from '#tests/helpers/factories'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

test.group('Token Model', () => {
  test('expirePasswordResetTokens: should expire all password reset tokens', async ({ assert }) => {
    const user = await UserFactory.create()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector: 'selector1',
      token: 'token1',
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector: 'selector2',
      token: 'token2',
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await Token.expirePasswordResetTokens(user)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(tokens, 0)
  })

  test('getPasswordResetUser: should return user for valid token', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`
    const foundUser = await Token.getPasswordResetUser(fullToken)

    assert.exists(foundUser)
    assert.equal(foundUser!.id, user.id)
  })

  test('getPasswordResetUser: should return undefined for invalid selector', async ({ assert }) => {
    const result = await Token.getPasswordResetUser('invalid.validator')

    assert.isUndefined(result)
  })

  test('getPasswordResetUser: should return undefined for wrong validator', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make('correct-validator'),
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.wrong-validator`
    const foundUser = await Token.getPasswordResetUser(fullToken)

    assert.isUndefined(foundUser)
  })

  test('getPasswordResetUser: should return undefined for expired token', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: 0,
      expiresAt: DateTime.now().minus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`
    const foundUser = await Token.getPasswordResetUser(fullToken)

    assert.isUndefined(foundUser)
  })

  test('getPasswordResetUser: should return undefined if max attempts exceeded', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: Token.MAX_RESET_ATTEMPTS,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`
    const foundUser = await Token.getPasswordResetUser(fullToken)

    assert.isUndefined(foundUser)
  })

  test('verify: should return true for valid token', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`
    const isValid = await Token.verify(fullToken)

    assert.isTrue(isValid)
  })

  test('verify: should return false for invalid token', async ({ assert }) => {
    const isValid = await Token.verify('invalid.token')

    assert.isFalse(isValid)
  })

  test('incrementAttempts: should increment attempts counter', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`

    await Token.incrementAttempts(fullToken)

    const token = await Token.findBy('selector', selector)
    assert.equal(token!.attempts, 1)

    await Token.incrementAttempts(fullToken)
    await token!.refresh()
    assert.equal(token!.attempts, 2)
  })

  test('hasExceededAttempts: should return true when max attempts exceeded', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: Token.MAX_RESET_ATTEMPTS,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`
    const exceeded = await Token.hasExceededAttempts(fullToken)

    assert.isTrue(exceeded)
  })

  test('hasExceededAttempts: should return false when under max attempts', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      attempts: 1,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const fullToken = `${selector}.${validator}`
    const exceeded = await Token.hasExceededAttempts(fullToken)

    assert.isFalse(exceeded)
  })

  test('expireEmailVerificationTokens: should expire all email verification tokens', async ({
    assert,
  }) => {
    const user = await UserFactory.create()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      selector: 'selector1',
      token: 'token1',
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    await Token.expireEmailVerificationTokens(user)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(tokens, 0)
  })

  test('getEmailVerificationUser: should return user for valid token', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const fullToken = `${selector}.${validator}`
    const foundUser = await Token.getEmailVerificationUser(fullToken)

    assert.exists(foundUser)
    assert.equal(foundUser!.id, user.id)
  })

  test('expireEmailChangeTokens: should expire all email change tokens', async ({ assert }) => {
    const user = await UserFactory.create()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      selector: 'selector1',
      token: 'token1',
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    await Token.expireEmailChangeTokens(user)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(tokens, 0)
  })

  test('getEmailChangeUser: should return user for valid token', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const fullToken = `${selector}.${validator}`
    const foundUser = await Token.getEmailChangeUser(fullToken)

    assert.exists(foundUser)
    assert.equal(foundUser!.id, user.id)
  })

  test('getUserInvitationToken: should return token for valid invitation', async ({ assert }) => {
    const user = await UserFactory.create()
    const selector = 'test-selector'
    const validator = 'test-validator'

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.USER_INVITATION,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const fullToken = `${selector}.${validator}`
    const token = await Token.getUserInvitationToken(fullToken)

    assert.exists(token)
    assert.equal(token!.userId, user.id)
  })

  test('expireInviteTokens: should expire all invitation tokens', async ({ assert }) => {
    const user = await UserFactory.create()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.USER_INVITATION,
      selector: 'selector1',
      token: 'token1',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    await Token.expireInviteTokens(user)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(tokens, 0)
  })

  test('MAX_RESET_ATTEMPTS constant: should be 3', ({ assert }) => {
    assert.equal(Token.MAX_RESET_ATTEMPTS, 3)
  })

  test('edge case: should handle malformed token format', async ({ assert }) => {
    const result = await Token.getPasswordResetUser('no-dot-separator')

    assert.isUndefined(result)
  })

  test('edge case: should handle empty selector', async ({ assert }) => {
    const result = await Token.getPasswordResetUser('.validator')

    assert.isUndefined(result)
  })

  test('edge case: should handle empty validator', async ({ assert }) => {
    const result = await Token.getPasswordResetUser('selector.')

    assert.isUndefined(result)
  })

  test('security: should not leak information about token existence', async ({ assert }) => {
    const result1 = await Token.getPasswordResetUser('nonexistent.token')
    const result2 = await Token.getPasswordResetUser('another.invalid')

    assert.isUndefined(result1)
    assert.isUndefined(result2)
  })

  test('consistency: multiple token types for same user', async ({ assert }) => {
    const user = await UserFactory.create()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector: 's1',
      token: 't1',
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      selector: 's2',
      token: 't2',
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    await Token.expirePasswordResetTokens(user)

    const passwordTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expiresAt', '>', DateTime.now().toSQL())

    const emailTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(passwordTokens, 0)
    assert.lengthOf(emailTokens, 1)
  })
})
