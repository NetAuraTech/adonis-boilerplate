import User from '#auth/models/user'
import Token from '#core/models/token'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { DateTime } from 'luxon'
import i18nManager from '@adonisjs/i18n/services/main'
import hash from '@adonisjs/core/services/hash'
import { generateToken } from '#core/helpers/crypto'

export default class PasswordService {
  /**
   * Send password reset link to user's email
   * Token is hashed before storage for security
   */
  async sendResetPasswordLink(user: User): Promise<void> {
    await Token.expirePasswordResetTokens(user)

    const plainToken = generateToken()

    const hashedToken = await hash.make(plainToken)

    await Token.create({
      userId: user.id,
      type: 'PASSWORD_RESET',
      token: hashedToken,
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const locale = user.locale || 'en'
    const i18n = i18nManager.locale(locale)

    const resetLink = `${env.get('DOMAIN')}/reset-password/${plainToken}`

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
