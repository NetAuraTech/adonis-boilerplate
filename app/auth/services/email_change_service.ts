import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateToken } from '#core/helpers/crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

export default class EmailChangeService {
  /**
   * Initiate email change process
   * - Send confirmation email to NEW address
   * - Send notification email to OLD address
   * - Store new email in pending_email
   */
  async initiateEmailChange(user: User, newEmail: string, i18n: any): Promise<void> {
    const oldEmail = user.email

    user.pendingEmail = newEmail
    await user.save()

    await Token.expireEmailChangeTokens(user)

    const plainToken = generateToken()
    const hashedToken = await hash.make(plainToken)

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      token: hashedToken,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const confirmationLink = `${env.get('DOMAIN')}/email/change/${plainToken}`

    try {
      await mail.send((message) => {
        message
          .to(newEmail)
          .subject(i18n.t('emails.email_change_confirmation.subject'))
          .htmlView('emails/email_change_confirmation', {
            locale: user.locale || 'en',
            appName: env.get('APP_NAME', 'AdonisJS'),
            greeting: i18n.t('emails.email_change_confirmation.greeting'),
            intro: i18n.t('emails.email_change_confirmation.intro', { email: newEmail }),
            action: i18n.t('emails.email_change_confirmation.action'),
            outro: i18n.t('emails.email_change_confirmation.outro'),
            expiry: i18n.t('emails.email_change_confirmation.expiry', { hours: 24 }),
            footer: i18n.t('emails.email_change_confirmation.footer'),
            confirmationLink,
          })
      })

      await mail.send((message) => {
        message
          .to(oldEmail)
          .subject(i18n.t('emails.email_change_notification.subject'))
          .htmlView('emails/email_change_notification', {
            locale: user.locale || 'en',
            appName: env.get('APP_NAME', 'AdonisJS'),
            greeting: i18n.t('emails.email_change_notification.greeting'),
            intro: i18n.t('emails.email_change_notification.intro', {
              oldEmail,
              newEmail,
            }),
            warning: i18n.t('emails.email_change_notification.warning'),
            action: i18n.t('emails.email_change_notification.action'),
            supportEmail: env.get('SMTP_FROM_ADDRESS'),
          })
      })

      logger.info('Email change initiated', {
        userId: user.id,
        oldEmail,
        newEmail,
      })
    } catch (error) {
      logger.error('Failed to send email change emails', {
        userId: user.id,
        oldEmail,
        newEmail,
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Confirm email change with token
   * - Validate token
   * - Move pending_email to email
   * - Mark email as verified
   * - Clear pending_email
   */
  async confirmEmailChange(plainToken: string): Promise<User | null> {
    const user = await Token.getEmailChangeUser(plainToken)

    if (!user || !user.pendingEmail) {
      return null
    }

    const oldEmail = user.email
    const newEmail = user.pendingEmail

    user.email = newEmail
    user.pendingEmail = null
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await Token.expireEmailChangeTokens(user)

    logger.info('Email changed successfully', {
      userId: user.id,
      oldEmail,
      newEmail,
    })

    return user
  }

  /**
   * Cancel pending email change
   */
  async cancelEmailChange(user: User): Promise<void> {
    if (!user.hasPendingEmailChange) {
      return
    }

    const pendingEmail = user.pendingEmail
    user.pendingEmail = null
    await user.save()

    await Token.expireEmailChangeTokens(user)

    logger.info('Email change cancelled', {
      userId: user.id,
      email: user.email,
      pendingEmail,
    })
  }
}
