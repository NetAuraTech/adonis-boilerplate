import { test } from '@japa/runner'
import EmailChangeService from '#auth/services/email_change_service'
import { UserFactory } from '#tests/helpers/factories'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'

test.group('EmailChangeService', (group) => {
  let emailChangeService: EmailChangeService

  group.setup(() => {
    emailChangeService = new EmailChangeService()
  })

  test('initiateEmailChange: should set pending email and create token', async ({
    assert,
    cleanup,
  }) => {
    mail.fake()
    const user = await UserFactory.create({ email: 'old@example.com' })

    await emailChangeService.initiateEmailChange(user, 'new@example.com')

    await user.refresh()
    assert.equal(user.pendingEmail, 'new@example.com')

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)

    assert.lengthOf(tokens, 1)
    assert.exists(tokens[0].selector)
    assert.exists(tokens[0].token)

    cleanup(() => {
      mail.restore()
    })
  })

  test('initiateEmailChange: should send two emails', async ({ cleanup }) => {
    const { mails } = mail.fake()
    const user = await UserFactory.create({ email: 'old@example.com' })

    await emailChangeService.initiateEmailChange(user, 'new@example.com')

    mails.assertSentCount(2)

    cleanup(() => {
      mail.restore()
    })
  })

  test('initiateEmailChange: should expire old tokens', async ({ assert, cleanup }) => {
    mail.fake()
    const user = await UserFactory.create()

    await emailChangeService.initiateEmailChange(user, 'first@example.com')

    const firstToken = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .firstOrFail()

    await emailChangeService.initiateEmailChange(user, 'second@example.com')

    await firstToken.refresh()
    assert.isTrue(firstToken.expiresAt! < DateTime.now())

    cleanup(() => {
      mail.restore()
    })
  })

  test('initiateEmailChange: should create token with 24 hours expiry', async ({
    assert,
    cleanup,
  }) => {
    mail.fake()
    const user = await UserFactory.create()

    await emailChangeService.initiateEmailChange(user, 'new@example.com')

    const token = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .firstOrFail()

    const expectedExpiry = DateTime.now().plus({ hours: 24 })
    const diff = token.expiresAt!.diff(expectedExpiry, 'minutes').minutes

    assert.isTrue(Math.abs(diff) < 1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('confirmEmailChange: should update email with valid token', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })
    const { selector, validator } = await createEmailChangeToken(user)
    const fullToken = `${selector}.${validator}`

    const confirmedUser = await emailChangeService.confirmEmailChange(fullToken)

    assert.isNotNull(confirmedUser)
    assert.equal(confirmedUser!.email, 'new@example.com')
    assert.isNull(confirmedUser!.pendingEmail)
  })

  test('confirmEmailChange: should verify email on confirmation', async ({ assert }) => {
    const user = await UserFactory.createUnverified({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })
    const { selector, validator } = await createEmailChangeToken(user)
    const fullToken = `${selector}.${validator}`

    const confirmedUser = await emailChangeService.confirmEmailChange(fullToken)

    assert.isNotNull(confirmedUser!.emailVerifiedAt)
  })

  test('confirmEmailChange: should expire all email change tokens', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })
    const { selector, validator } = await createEmailChangeToken(user)
    const fullToken = `${selector}.${validator}`

    await emailChangeService.confirmEmailChange(fullToken)

    const validTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(validTokens, 0)
  })

  test('confirmEmailChange: should return null for invalid token', async ({ assert }) => {
    const result = await emailChangeService.confirmEmailChange('invalid.token')

    assert.isNull(result)
  })

  test('confirmEmailChange: should return null for expired token', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })
    const { selector, validator } = await createEmailChangeToken(user, {
      expiresAt: DateTime.now().minus({ hours: 1 }),
    })
    const fullToken = `${selector}.${validator}`

    const result = await emailChangeService.confirmEmailChange(fullToken)

    assert.isNull(result)
  })

  test('confirmEmailChange: should return null if no pending email', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: null,
    })
    const { selector, validator } = await createEmailChangeToken(user)
    const fullToken = `${selector}.${validator}`

    const result = await emailChangeService.confirmEmailChange(fullToken)

    assert.isNull(result)
  })

  test('confirmEmailChange: should return null for wrong validator', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })
    const { selector } = await createEmailChangeToken(user)
    const fullToken = `${selector}.wrong-validator`

    const result = await emailChangeService.confirmEmailChange(fullToken)

    assert.isNull(result)
  })

  test('cancelEmailChange: should clear pending email', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })

    await emailChangeService.cancelEmailChange(user)

    await user.refresh()
    assert.isNull(user.pendingEmail)
  })

  test('cancelEmailChange: should expire all email change tokens', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })
    await createEmailChangeToken(user)

    await emailChangeService.cancelEmailChange(user)

    const validTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(validTokens, 0)
  })

  test('cancelEmailChange: should handle user without pending email', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: null,
    })

    await emailChangeService.cancelEmailChange(user)

    await user.refresh()
    assert.isNull(user.pendingEmail)
  })

  test('cancelEmailChange: should not affect user email', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })

    await emailChangeService.cancelEmailChange(user)

    await user.refresh()
    assert.equal(user.email, 'old@example.com')
  })

  test('should handle multiple email changes correctly', async ({ assert, cleanup }) => {
    mail.fake()
    const user = await UserFactory.create({ email: 'original@example.com' })

    await emailChangeService.initiateEmailChange(user, 'first@example.com')
    await user.refresh()
    assert.equal(user.pendingEmail, 'first@example.com')

    await emailChangeService.initiateEmailChange(user, 'second@example.com')
    await user.refresh()
    assert.equal(user.pendingEmail, 'second@example.com')

    const validTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(validTokens, 1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('full workflow: initiate, confirm, verify final state', async ({ assert, cleanup }) => {
    mail.fake()
    const user = await UserFactory.create({ email: 'old@example.com' })

    await emailChangeService.initiateEmailChange(user, 'new@example.com')

    const token = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .firstOrFail()

    const validator = 'test-validator'
    token.token = await hash.make(validator)
    await token.save()

    const fullToken = `${token.selector}.${validator}`
    const confirmedUser = await emailChangeService.confirmEmailChange(fullToken)

    assert.equal(confirmedUser!.email, 'new@example.com')
    assert.isNull(confirmedUser!.pendingEmail)
    assert.isNotNull(confirmedUser!.emailVerifiedAt)

    cleanup(() => {
      mail.restore()
    })
  })

  test('full workflow: initiate, cancel, verify state', async ({ assert, cleanup }) => {
    mail.fake()
    const user = await UserFactory.create({ email: 'old@example.com' })

    await emailChangeService.initiateEmailChange(user, 'new@example.com')
    await emailChangeService.cancelEmailChange(user)

    await user.refresh()
    assert.equal(user.email, 'old@example.com')
    assert.isNull(user.pendingEmail)

    cleanup(() => {
      mail.restore()
    })
  })
})

const createEmailChangeToken = async (
  user: any,
  override: Partial<Token> = {}
): Promise<{ selector: string; validator: string }> => {
  const selector = 'test-selector-' + Date.now()
  const validator = 'test-validator-' + Date.now()
  const hashedValidator = await hash.make(validator)

  await Token.create({
    userId: user.id,
    type: TOKEN_TYPES.EMAIL_CHANGE,
    selector,
    token: hashedValidator,
    expiresAt: DateTime.now().plus({ hours: 24 }),
    ...override,
  })

  return { selector, validator }
}
