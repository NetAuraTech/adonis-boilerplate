import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateToken } from '#core/helpers/crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

export default class EmailVerificationService {
  /**
   * Generate and send email verification link
   */
  async sendVerificationEmail(user: User, i18n: any): Promise<void> {
    await Token.expireEmailVerificationTokens(user)

    const plainToken = generateToken()
    const hashedToken = await hash.make(plainToken)

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      token: hashedToken,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const verificationLink = `${env.get('DOMAIN')}/email/verify/${plainToken}`

    try {
      await mail.send((message) => {
        message
          .to(user.email)
          .subject(i18n.t('emails.verify_email.subject'))
          .htmlView('emails/verify_email', {
            locale: user.locale || 'en',
            appName: env.get('APP_NAME', 'AdonisJS'),
            greeting: i18n.t('emails.verify_email.greeting'),
            intro: i18n.t('emails.verify_email.intro'),
            action: i18n.t('emails.verify_email.action'),
            outro: i18n.t('emails.verify_email.outro'),
            expiry: i18n.t('emails.verify_email.expiry', { hours: 24 }),
            footer: i18n.t('emails.verify_email.footer'),
            verificationLink,
          })
      })

      logger.info('Email verification sent', {
        userId: user.id,
        email: user.email,
      })
    } catch (error) {
      logger.error('Failed to send verification email', {
        userId: user.id,
        email: user.email,
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(plainToken: string): Promise<User | null> {
    const user = await Token.getEmailVerificationUser(plainToken)

    if (!user) {
      return null
    }

    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await Token.expireEmailVerificationTokens(user)

    logger.info('Email verified successfully', {
      userId: user.id,
      email: user.email,
    })

    return user
  }

  /**
   * Mark email as verified without token (for OAuth)
   */
  async markAsVerified(user: User): Promise<void> {
    if (user.isEmailVerified) {
      return
    }

    user.emailVerifiedAt = DateTime.now()
    await user.save()

    logger.info('Email marked as verified (OAuth)', {
      userId: user.id,
      email: user.email,
    })
  }
}
