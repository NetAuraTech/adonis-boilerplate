import User from '#auth/models/user'
import Token from '#core/models/token'
import env from '#start/env'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { generateSplitToken, maskToken } from '#core/helpers/crypto'
import logger from '@adonisjs/core/services/logger'
import { Exception } from '@adonisjs/core/exceptions'
import ResetPasswordMail from '#auth/mails/reset_password_mail'
import { I18n } from '@adonisjs/i18n'
import { inject } from '@adonisjs/core'
import NotificationService from '#notification/services/notification_service'

interface ResetPasswordPayload {
  token: string
  password: string
}

/**
 * Service for handling password reset workflows
 */
@inject()
export default class PasswordService {
  constructor(protected notificationService: NotificationService) {}

  /**
   * Send password reset link to user's email
   *
   * - Expires all existing password reset tokens for the user
   * - Generates a new token using selector/validator pattern
   * - Sends email with reset link valid for 1 hour
   *
   * Token uses selector/validator pattern for secure and efficient lookup:
   * - Selector is stored in plain text for fast database lookup
   * - Validator is hashed for security
   *
   * @param user - The user requesting password reset
   * @param translator
   * @throws Error if email sending fails
   */
  async sendResetPasswordLink(user: User, translator: I18n): Promise<void> {
    await Token.expirePasswordResetTokens(user)

    const { selector, validator, fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await Token.create({
      userId: user.id,
      type: 'PASSWORD_RESET',
      selector: selector,
      token: hashedValidator,
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const resetLink = `${env.get('DOMAIN')}/reset-password/${fullToken}`

    try {
      await this.notificationService.notify(new ResetPasswordMail(user, resetLink, translator))

      await this.notificationService.notify({
        userId: user.id,
        type: 'security',
        title: translator.t('notifications.password_reset_requested.title'),
        message: translator.t('notifications.password_reset_requested.message'),
        data: { resetLink },
      })

      logger.info('Password reset email sent', {
        userId: user.id,
        email: user.email,
      })
    } catch (error) {
      logger.error('Failed to send password reset email', {
        userId: user.id,
        email: user.email,
        error: error.message,
      })
      throw error
    }
  }

  /**
   * Validates a reset token.
   *
   * @param token - The token to validate.
   * @returns true if the token is valid.
   * @throws Exception if the token is invalid or expired.
   */
  async validateResetToken(token: string): Promise<boolean> {
    const isValid = await Token.verify(token)

    if (!isValid) {
      const exceededAttempts = await Token.hasExceededAttempts(token)

      if (exceededAttempts) {
        logger.warn('Password reset token exceeded max attempts', {
          token: maskToken(token),
        })
        throw new Exception('Max attempts exceeded', {
          status: 429,
          code: 'E_MAX_ATTEMPTS_EXCEEDED',
        })
      }

      logger.warn('Invalid or expired password reset token', {
        token: maskToken(token),
      })
      throw new Exception('Invalid or expired token', {
        status: 400,
        code: 'E_TOKEN_EXPIRED',
      })
    }

    return true
  }

  /**
   * Resets a user's password.
   *
   * @param payload - ResetPasswordPayload.
   * @param translator
   * @returns The user with the updated password.
   * @throws Exception if the token is invalid or if the attempts are exceeded.
   */
  async resetPassword(payload: ResetPasswordPayload, translator: I18n): Promise<User> {
    await Token.incrementAttempts(payload.token)

    const exceededAttempts = await Token.hasExceededAttempts(payload.token)
    if (exceededAttempts) {
      logger.error('Password reset max attempts exceeded', {
        token: maskToken(payload.token),
      })
      throw new Exception('Max attempts exceeded', {
        status: 429,
        code: 'E_MAX_ATTEMPTS_EXCEEDED',
      })
    }

    const user = await Token.getPasswordResetUser(payload.token)

    if (!user) {
      logger.warn('Failed password reset - invalid token', {
        token: maskToken(payload.token),
      })
      throw new Exception('Invalid token', {
        status: 400,
        code: 'E_INVALID_TOKEN',
      })
    }

    user.password = payload.password
    await user.save()

    await Token.expirePasswordResetTokens(user)

    logger.info('Password reset successful', {
      userId: user.id,
      token: maskToken(payload.token),
    })

    await this.notificationService.notify({
      userId: user.id,
      type: 'security',
      title: translator.t('notifications.password_changed.title'),
      message: translator.t('notifications.password_changed.message'),
    })

    return user
  }
}
