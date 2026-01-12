import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import env from '#start/env'
import { I18n } from '@adonisjs/i18n'

export default class ChangeEmailConfirmationMail extends BaseMail {
  constructor(
    private user: User,
    private newEmail: string,
    private confirmationLink: string,
    private translator: I18n
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.newEmail)
      .subject(this.translator.t('emails.email_change_confirmation.subject'))
      .htmlView('emails/email_change_confirmation', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: this.translator.t('emails.email_change_confirmation.greeting'),
        intro: this.translator.t('emails.email_change_confirmation.intro', {
          email: this.newEmail,
        }),
        action: this.translator.t('emails.email_change_confirmation.action'),
        outro: this.translator.t('emails.email_change_confirmation.outro'),
        expiry: this.translator.t('emails.email_change_confirmation.expiry', { hours: 24 }),
        footer: this.translator.t('emails.email_change_confirmation.footer'),
        confirmationLink: this.confirmationLink,
      })
  }
}
