import User from '#auth/models/user'
import Token from '#core/models/token'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { DateTime } from 'luxon'
import i18nManager from '@adonisjs/i18n/services/main'
import hash from '@adonisjs/core/services/hash'
import { generateSplitToken } from '#core/helpers/crypto'

/**
 * Service for handling password reset workflows
 */
export default class PasswordService {
  /**
   * Send password reset link to user's email
   *
   * - Expires all existing password reset tokens for the user
   * - Generates a new token using selector/validator pattern
   * - Sends email with reset link valid for 1 hour
   *
   * Token uses selector/validator pattern for secure and efficient lookup:
   * - Selector is stored in plain text for fast database lookup
   * - Validator is hashed for security
   *
   * @param user - The user requesting password reset
   * @throws Error if email sending fails
   */
  async sendResetPasswordLink(user: User): Promise<void> {
    await Token.expirePasswordResetTokens(user)

    const { selector, validator, fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await Token.create({
      userId: user.id,
      type: 'PASSWORD_RESET',
      selector: selector,
      token: hashedValidator,
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const locale = user.locale || 'en'
    const i18n = i18nManager.locale(locale)

    const resetLink = `${env.get('DOMAIN')}/reset-password/${fullToken}`

    await mail.send((message) => {
      message
        .to(user.email)
        .subject(i18n.t('emails.reset_password.subject'))
        .htmlView('emails/reset_password', {
          locale,
          appName: env.get('APP_NAME'),
          greeting: i18n.t('emails.reset_password.greeting'),
          intro: i18n.t('emails.reset_password.intro'),
          action: i18n.t('emails.reset_password.action'),
          outro: i18n.t('emails.reset_password.outro'),
          expiry: i18n.t('emails.reset_password.expiry', { hours: 1 }),
          footer: i18n.t('emails.reset_password.footer'),
          resetLink,
        })
    })
  }
}
