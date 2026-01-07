import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateSplitToken } from '#core/helpers/crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Service for handling email verification workflows
 */
export default class EmailVerificationService {
  /**
   * Generate and send email verification link
   *
   * Creates a new verification token using selector/validator pattern
   * and sends an email with a verification link to the user
   *
   * @param user - The user to send verification email to
   * @param i18n - Internationalization instance for translations
   * @throws Exception E_EMAIL_SEND_FAILED
   */
  async sendVerificationEmail(user: User, i18n: any): Promise<void> {
    await Token.expireEmailVerificationTokens(user)

    const { selector, validator, fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      selector: selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const verificationLink = `${env.get('DOMAIN')}/email/verify/${fullToken}`

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
      throw new Exception('Failed to send verification email', {
        status: 500,
        code: 'E_EMAIL_SEND_FAILED',
      })
    }
  }

  /**
   * Verify email with token
   *
   * Validates the token and marks the user's email as verified
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns User if verification successful, null if token is invalid or expired
   */
  async verifyEmail(fullToken: string): Promise<User | null> {
    const user = await Token.getEmailVerificationUser(fullToken)

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
   *
   * Used when a user signs in via OAuth provider with a verified email
   *
   * @param user - The user whose email should be marked as verified
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
