import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import User from '#auth/models/user'
import string from '@adonisjs/core/helpers/string'
import Token from '#core/models/token'
import router from '@adonisjs/core/services/router'
import Env from '#start/env'
import i18nManager from '@adonisjs/i18n/services/main'

export default class PasswordService {
  async sendResetPasswordLink(user: User) {
    const token = string.generateRandom(64)

    await Token.expirePasswordResetTokens(user)

    const record = await user.related('tokens').create({
      type: 'PASSWORD_RESET',
      expiresAt: DateTime.now().plus({ hour: 1 }),
      token,
    })

    const resetLink = `${Env.get('DOMAIN')}${router.makeUrl('auth.reset.password', [record.token])}`

    const locale = user.locale || 'en'
    const i18n = i18nManager.locale(locale)

    const appName = Env.get('APP_NAME', 'AdonisJS')

    await mail.send((message) => {
      message
        .to(user.email)
        .from(Env.get('SMTP_USERNAME', 'noreply@example.com'))
        .subject(i18n.t('emails.reset_password.subject'))
        .htmlView('emails/reset_password', {
          locale,
          subject: i18n.t('emails.reset_password.subject'),
          appName,
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
