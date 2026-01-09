import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import i18n from 'i18next'
import env from '#start/env'

export default class ResetPasswordMail extends BaseMail {
  constructor(
    private user: User,
    private resetLink: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .subject(i18n.t('emails.reset_password.subject'))
      .htmlView('emails/reset_password', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: i18n.t('emails.reset_password.greeting'),
        intro: i18n.t('emails.reset_password.intro'),
        action: i18n.t('emails.reset_password.action'),
        outro: i18n.t('emails.reset_password.outro'),
        expiry: i18n.t('emails.reset_password.expiry', { hours: 1 }),
        footer: i18n.t('emails.reset_password.footer'),
        resetLink: this.resetLink,
      })
  }
}
