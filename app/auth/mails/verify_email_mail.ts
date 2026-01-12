import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import env from '#start/env'
import { I18n } from '@adonisjs/i18n'

export default class VerifyEmailMail extends BaseMail {
  constructor(
    private user: User,
    private verificationLink: string,
    private translator: I18n
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .subject(this.translator.t('emails.verify_email.subject'))
      .htmlView('emails/verify_email', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: this.translator.t('emails.verify_email.greeting'),
        intro: this.translator.t('emails.verify_email.intro'),
        action: this.translator.t('emails.verify_email.action'),
        outro: this.translator.t('emails.verify_email.outro'),
        expiry: this.translator.t('emails.verify_email.expiry', { hours: 24 }),
        footer: this.translator.t('emails.verify_email.footer'),
        verificationLink: this.verificationLink,
      })
  }
}
