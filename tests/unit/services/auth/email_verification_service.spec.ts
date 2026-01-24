import { test } from '@japa/runner'
import EmailVerificationService from '#auth/services/email_verification_service'
import { UserFactory } from '#tests/helpers/factories'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import i18n from 'i18next'
import { I18n } from '@adonisjs/i18n'
import NotificationService from '#notification/services/notification_service'
import LogService from '#core/services/log_service'

test.group('EmailVerificationService', (group) => {
  let emailVerificationService: EmailVerificationService
  let notificationService: NotificationService
  let logService: LogService

  group.setup(() => {
    logService = new LogService()
    notificationService = new NotificationService(logService)
    emailVerificationService = new EmailVerificationService(notificationService, logService)
  })

  test('sendVerificationEmail: should create email verification token', async ({
    assert,
    cleanup,
  }) => {
    const { mails } = mail.fake()

    const user = await UserFactory.createUnverified()

    await emailVerificationService.sendVerificationEmail(user, i18n as unknown as I18n)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)

    assert.lengthOf(tokens, 1)
    assert.exists(tokens[0].selector)
    assert.exists(tokens[0].token)

    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendVerificationEmail: should expire old tokens and send email', async ({
    assert,
    cleanup,
  }) => {
    const { mails } = mail.fake()

    const user = await UserFactory.createUnverified()

    await emailVerificationService.sendVerificationEmail(user, i18n as unknown as I18n)

    const firstToken = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .firstOrFail()

    await emailVerificationService.sendVerificationEmail(user, i18n as unknown as I18n)

    await firstToken.refresh()
    assert.isTrue(firstToken.expiresAt! < DateTime.now(), 'First token should be expired')

    mails.assertSentCount(2)

    cleanup(() => {
      mail.restore()
    })
  })

  test('verifyEmail: should verify user email with valid token', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createEmailVerificationToken(user)
    const fullToken = `${selector}.${validator}`

    const verifiedUser = await emailVerificationService.verifyEmail(fullToken)

    assert.exists(verifiedUser)
    assert.equal(verifiedUser!.id, user.id)
    assert.isNotNull(verifiedUser!.emailVerifiedAt)
  })

  test('verifyEmail: should return null for invalid token', async ({ assert }) => {
    const result = await emailVerificationService.verifyEmail('invalid.token')
    assert.isNull(result)
  })

  test('verifyEmail: should return null for expired token', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createEmailVerificationToken(user, {
      expiresAt: DateTime.now().minus({ hours: 1 }),
    })
    const fullToken = `${selector}.${validator}`

    const result = await emailVerificationService.verifyEmail(fullToken)
    assert.isNull(result)
  })

  test('verifyEmail: should expire token after successful verification', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createEmailVerificationToken(user)
    const fullToken = `${selector}.${validator}`

    await emailVerificationService.verifyEmail(fullToken)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .where('expiresAt', '>', DateTime.now().toSQL()!)

    assert.lengthOf(tokens, 0)
  })

  test('markAsVerified: should mark email as verified', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    await emailVerificationService.markAsVerified(user)

    await user.refresh()
    assert.isNotNull(user.emailVerifiedAt)
  })

  test('markAsVerified: should not change already verified email', async ({ assert }) => {
    const user = await UserFactory.create()
    const originalDate = user.emailVerifiedAt

    await emailVerificationService.markAsVerified(user)

    await user.refresh()
    assert.equal(user.emailVerifiedAt?.toISO(), originalDate?.toISO())
  })
})

const createEmailVerificationToken = async (
  user: any,
  override: Partial<Token> = {}
): Promise<{ selector: string; validator: string }> => {
  const selector = 'test-selector-' + Date.now()
  const validator = 'test-validator-' + Date.now()
  const hashedValidator = await hash.make(validator)

  await Token.create({
    userId: user.id,
    type: TOKEN_TYPES.EMAIL_VERIFICATION,
    selector,
    token: hashedValidator,
    expiresAt: DateTime.now().plus({ hours: 24 }),
    ...override,
  })

  return { selector, validator }
}
