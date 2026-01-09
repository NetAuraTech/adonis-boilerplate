import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import i18n from 'i18next'
import env from '#start/env'

export default class ChangeEmailConfirmationMail extends BaseMail {
  constructor(
    private user: User,
    private newEmail: string,
    private confirmationLink: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.newEmail)
      .subject(i18n.t('emails.email_change_confirmation.subject'))
      .htmlView('emails/email_change_confirmation', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: i18n.t('emails.email_change_confirmation.greeting'),
        intro: i18n.t('emails.email_change_confirmation.intro', { email: this.newEmail }),
        action: i18n.t('emails.email_change_confirmation.action'),
        outro: i18n.t('emails.email_change_confirmation.outro'),
        expiry: i18n.t('emails.email_change_confirmation.expiry', { hours: 24 }),
        footer: i18n.t('emails.email_change_confirmation.footer'),
        confirmationLink: this.confirmationLink,
      })
  }
}
