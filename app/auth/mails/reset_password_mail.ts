import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import env from '#start/env'
import { I18n } from '@adonisjs/i18n'

export default class ResetPasswordMail extends BaseMail {
  constructor(
    private user: User,
    private resetLink: string,
    private translator: I18n
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .subject(this.translator.t('emails.reset_password.subject'))
      .htmlView('emails/reset_password', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: this.translator.t('emails.reset_password.greeting'),
        intro: this.translator.t('emails.reset_password.intro'),
        action: this.translator.t('emails.reset_password.action'),
        outro: this.translator.t('emails.reset_password.outro'),
        expiry: this.translator.t('emails.reset_password.expiry', { hours: 1 }),
        footer: this.translator.t('emails.reset_password.footer'),
        resetLink: this.resetLink,
      })
  }
}
