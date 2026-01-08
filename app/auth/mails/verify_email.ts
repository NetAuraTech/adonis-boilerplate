import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import i18n from 'i18next'
import env from '#start/env'

export default class VerifyEmailMail extends BaseMail {
  constructor(
    private user: User,
    private verificationLink: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .subject(i18n.t('emails.verify_email.subject'))
      .htmlView('emails/verify_email', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: i18n.t('emails.verify_email.greeting'),
        intro: i18n.t('emails.verify_email.intro'),
        action: i18n.t('emails.verify_email.action'),
        outro: i18n.t('emails.verify_email.outro'),
        expiry: i18n.t('emails.verify_email.expiry', { hours: 24 }),
        footer: i18n.t('emails.verify_email.footer'),
        verificationLink: this.verificationLink,
      })
  }
}
