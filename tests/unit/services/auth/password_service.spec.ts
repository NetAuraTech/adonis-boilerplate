import { test } from '@japa/runner'
import PasswordService from '#auth/services/password_service'
import { UserFactory } from '#tests/helpers/factories'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import i18n from 'i18next'
import { I18n } from '@adonisjs/i18n'
import app from '@adonisjs/core/services/app'

test.group('PasswordService', (group) => {
  let passwordService: PasswordService

  group.setup(async () => {
    passwordService = await app.container.make(PasswordService)
  })

  test('sendResetPasswordLink: should create password reset token', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    const user = await UserFactory.create()

    await passwordService.sendResetPasswordLink(user, i18n as unknown as I18n)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)

    assert.lengthOf(tokens, 1)
    assert.exists(tokens[0].selector)
    assert.exists(tokens[0].token)
    assert.isTrue(tokens[0].expiresAt! > DateTime.now())

    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendResetPasswordLink: should expire old tokens', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    const user = await UserFactory.create()

    // Create first token
    await passwordService.sendResetPasswordLink(user, i18n as unknown as I18n)
    const firstTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)

    // Create second token
    await passwordService.sendResetPasswordLink(user, i18n as unknown as I18n)

    await firstTokens[0].refresh()
    assert.isTrue(firstTokens[0].expiresAt! < DateTime.now())

    mails.assertSentCount(2)

    cleanup(() => {
      mail.restore()
    })
  })

  test('validateResetToken: should validate valid token', async ({ assert }) => {
    const user = await UserFactory.create()
    const { selector, validator } = await createPasswordResetToken(user)
    const fullToken = `${selector}.${validator}`

    const isValid = await passwordService.validateResetToken(fullToken)

    assert.isTrue(isValid)
  })

  test('validateResetToken: should reject expired token', async ({ assert }) => {
    const user = await UserFactory.create()
    const { selector, validator } = await createPasswordResetToken(user, {
      expiresAt: DateTime.now().minus({ hours: 1 }),
    })
    const fullToken = `${selector}.${validator}`

    await assert.rejects(
      async () => passwordService.validateResetToken(fullToken),
      'Invalid or expired token'
    )
  })

  test('validateResetToken: should reject invalid token format', async ({ assert }) => {
    await assert.rejects(
      async () => passwordService.validateResetToken('invalid-token'),
      'Invalid or expired token'
    )
  })

  test('resetPassword: should update user password', async ({ assert }) => {
    const user = await UserFactory.create({ password: 'oldpassword' })
    const { selector, validator } = await createPasswordResetToken(user)
    const fullToken = `${selector}.${validator}`

    const updatedUser = await passwordService.resetPassword(
      {
        token: fullToken,
        password: 'newpassword123',
      },
      i18n as unknown as I18n
    )

    await updatedUser.refresh()
    const isValid = await hash.verify(updatedUser.password!, 'newpassword123')
    assert.isTrue(isValid)
  })

  test('resetPassword: should expire token after use', async ({ assert }) => {
    const user = await UserFactory.create()
    const { selector, validator } = await createPasswordResetToken(user)
    const fullToken = `${selector}.${validator}`

    await passwordService.resetPassword(
      {
        token: fullToken,
        password: 'newpassword123',
      },
      i18n as unknown as I18n
    )

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expiresAt', '>', DateTime.now().toSQL()!)

    assert.lengthOf(tokens, 0)
  })

  test('resetPassword: should track attempts', async ({ assert }) => {
    const user = await UserFactory.create()
    const { selector } = await createPasswordResetToken(user)
    const wrongToken = `${selector}.wrongvalidator`

    // Attempt with wrong token
    await assert.rejects(async () =>
      passwordService.resetPassword(
        {
          token: wrongToken,
          password: 'newpassword123',
        },
        i18n as unknown as I18n
      )
    )

    const token = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .firstOrFail()

    assert.equal(token.attempts, 1)
  })

  test('resetPassword: should reject after max attempts', async ({ assert }) => {
    const user = await UserFactory.create()
    const { selector, validator } = await createPasswordResetToken(user, { attempts: 3 })
    const fullToken = `${selector}.${validator}`

    await assert.rejects(
      async () =>
        passwordService.resetPassword(
          {
            token: fullToken,
            password: 'newpassword123',
          },
          i18n as unknown as I18n
        ),
      'Max attempts exceeded'
    )
  })

  test('resetPassword: should fail if user is deleted', async ({ assert }) => {
    const user = await UserFactory.create()
    const { selector, validator } = await createPasswordResetToken(user)
    const fullToken = `${selector}.${validator}`

    await user.delete()

    await assert.rejects(
      async () =>
        passwordService.resetPassword(
          {
            token: fullToken,
            password: 'newpassword123',
          },
          i18n as unknown as I18n
        ),
      'Invalid token'
    )
  })
})

const createPasswordResetToken = async (
  user: any,
  override: Partial<Token> = {}
): Promise<{ selector: string; validator: string }> => {
  const selector = 'test-selector-' + Date.now()
  const validator = 'test-validator-' + Date.now()
  const hashedValidator = await hash.make(validator)

  await Token.create({
    userId: user.id,
    type: TOKEN_TYPES.PASSWORD_RESET,
    selector,
    token: hashedValidator,
    attempts: 0,
    expiresAt: DateTime.now().plus({ hours: 1 }),
    ...override,
  })

  return { selector, validator }
}
