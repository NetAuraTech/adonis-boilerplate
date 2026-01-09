import { BaseMail } from '@adonisjs/mail'
import User from '#auth/models/user'
import i18n from 'i18next'
import env from '#start/env'

export default class InvitationMail extends BaseMail {
  constructor(
    private user: User,
    private invitationLink: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email)
      .subject(
        i18n.t('emails.user_invitation.subject', { appName: env.get('APP_NAME', 'AdonisJS') })
      )
      .htmlView('emails/user_invitation', {
        locale: 'en',
        appName: env.get('APP_NAME', 'AdonisJS'),
        greeting: i18n.t('emails.user_invitation.greeting'),
        intro: i18n.t('emails.user_invitation.intro', { appName: env.get('APP_NAME', 'AdonisJS') }),
        action: i18n.t('emails.user_invitation.action'),
        outro: i18n.t('emails.user_invitation.outro'),
        expiry: i18n.t('emails.user_invitation.expiry', { days: 7 }),
        footer: i18n.t('emails.user_invitation.footer'),
        invitationLink: this.invitationLink,
      })
  }
}
