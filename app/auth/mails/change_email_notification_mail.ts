import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import i18n from 'i18next'
import env from '#start/env'

export default class ChangeEmailNotificationMail extends BaseMail {
  constructor(
    private user: User,
    private oldEmail: string,
    private newEmail: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.oldEmail)
      .subject(i18n.t('emails.email_change_notification.subject'))
      .htmlView('emails/email_change_notification', {
        locale: this.user.locale || 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: i18n.t('emails.email_change_notification.greeting'),
        intro: i18n.t('emails.email_change_notification.intro', {
          oldEmail: this.oldEmail,
          newEmail: this.newEmail,
        }),
        warning: i18n.t('emails.email_change_notification.warning'),
        action: i18n.t('emails.email_change_notification.action'),
        supportEmail: env.get('SMTP_FROM_ADDRESS'),
      })
  }
}
