import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import env from '#start/env'
import { I18n } from '@adonisjs/i18n'

export default class InvitationMail extends BaseMail {
  constructor(
    private user: User,
    private invitationLink: string,
    private translator: I18n
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .subject(
        this.translator.t('emails.user_invitation.subject', {
          appName: env.get('APP_NAME', 'AdonisJS'),
        })
      )
      .htmlView('emails/user_invitation', {
        locale: 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: this.translator.t('emails.user_invitation.greeting'),
        intro: this.translator.t('emails.user_invitation.intro', {
          appName: env.get('APP_NAME', 'AdonisJS'),
        }),
        action: this.translator.t('emails.user_invitation.action'),
        outro: this.translator.t('emails.user_invitation.outro'),
        expiry: this.translator.t('emails.user_invitation.expiry', { days: 7 }),
        footer: this.translator.t('emails.user_invitation.footer'),
        invitationLink: this.invitationLink,
      })
  }
}
