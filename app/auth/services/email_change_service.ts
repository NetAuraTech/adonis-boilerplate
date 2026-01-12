import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateSplitToken } from '#core/helpers/crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import ChangeEmailNotificationMail from '#auth/mails/change_email_notification_mail'
import ChangeEmailConfirmationMail from '#auth/mails/change_email_confirmation_mail'
import { I18n } from '@adonisjs/i18n'

/**
 * Service for handling email change workflows
 */
export default class EmailChangeService {
  /**
   * Initiate email change process
   *
   * - Sends confirmation email to NEW address with verification link
   * - Sends notification email to OLD address for security
   * - Stores new email in pending_email field
   *
   * @param user - The user requesting email change
   * @param newEmail - The new email address to change to
   * @param translator
   * @throws Error if email sending fails
   */
  async initiateEmailChange(user: User, newEmail: string, translator: I18n): Promise<void> {
    const oldEmail = user.email

    user.pendingEmail = newEmail
    await user.save()

    await Token.expireEmailChangeTokens(user)

    const { selector, validator, fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      selector: selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const confirmationLink = `${env.get('DOMAIN')}/email/change/${fullToken}`

    try {
      await mail.send(new ChangeEmailConfirmationMail(user, newEmail, confirmationLink, translator))

      await mail.send(new ChangeEmailNotificationMail(user, oldEmail, newEmail, translator))

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
   *
   * - Validates the token
   * - Moves pending_email to email
   * - Marks email as verified
   * - Clears pending_email
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns User if email change successful, null if token is invalid or expired
   */
  async confirmEmailChange(fullToken: string): Promise<User | null> {
    const user = await Token.getEmailChangeUser(fullToken)

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
   *
   * Clears the pending_email field and expires all email change tokens
   *
   * @param user - The user whose pending email change should be cancelled
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
