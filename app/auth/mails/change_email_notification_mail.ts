import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import env from '#start/env'
import { I18n } from '@adonisjs/i18n'

export default class ChangeEmailNotificationMail extends BaseMail {
  constructor(
    private user: User,
    private oldEmail: string,
    private newEmail: string,
    private translator: I18n
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.oldEmail)
      .subject(this.translator.t('emails.email_change_notification.subject'))
      .htmlView('emails/email_change_notification', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: this.translator.t('emails.email_change_notification.greeting'),
        intro: this.translator.t('emails.email_change_notification.intro', {
          oldEmail: this.oldEmail,
          newEmail: this.newEmail,
        }),
        warning: this.translator.t('emails.email_change_notification.warning'),
        action: this.translator.t('emails.email_change_notification.action'),
        supportEmail: env.get('SMTP_FROM_ADDRESS'),
      })
  }
}
