import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateSplitToken } from '#core/helpers/crypto'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import ChangeEmailNotificationMail from '#auth/mails/change_email_notification_mail'
import ChangeEmailConfirmationMail from '#auth/mails/change_email_confirmation_mail'
import { I18n } from '@adonisjs/i18n'
import { inject } from '@adonisjs/core'
import NotificationService from '#notification/services/notification_service'
import LogService, { LogCategory } from '#core/services/log_service'

/**
 * Service for handling email change workflows
 */
@inject()
export default class EmailChangeService {
  constructor(
    protected notificationService: NotificationService,
    protected logService: LogService
  ) {}

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
      await this.notificationService.notify(
        new ChangeEmailConfirmationMail(user, newEmail, confirmationLink, translator)
      )

      await this.notificationService.notify(
        new ChangeEmailNotificationMail(user, oldEmail, newEmail, translator)
      )

      await this.notificationService.notify({
        userId: user.id,
        type: 'account',
        title: translator.t('notifications.email_change_requested.title'),
        message: translator.t('notifications.email_change_requested.message', {
          newEmail,
        }),
        data: { oldEmail, newEmail, confirmationLink },
      })

      this.logService.logAuth('email_change.initiated', {
        userId: user.id,
        userEmail: oldEmail,
      })
    } catch (error) {
      this.logService.error({
        message: 'Failed to send email change emails',
        category: LogCategory.AUTH,
        error,
        context: {
          userId: user.id,
          userEmail: oldEmail,
        },
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
   * @param translator
   * @returns User if email change successful, null if token is invalid or expired
   */
  async confirmEmailChange(fullToken: string, translator: I18n): Promise<User | null> {
    const user = await Token.getEmailChangeUser(fullToken)

    if (!user || !user.pendingEmail) {
      this.logService.logAuth('email_change.failed.invalid_token', {})
      return null
    }

    const oldEmail = user.email
    const newEmail = user.pendingEmail

    user.email = newEmail
    user.pendingEmail = null
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await Token.expireEmailChangeTokens(user)

    this.logService.logAuth('email_change.confirmed', {
      userId: user.id,
      userEmail: newEmail,
    })

    await this.notificationService.notify({
      userId: user.id,
      type: 'email_changed',
      title: translator.t('notifications.email_changed.title'),
      message: translator.t('notifications.email_changed.message', {
        newEmail,
      }),
      data: { oldEmail, newEmail },
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

    this.logService.logAuth('email_change.cancelled', {
      userId: user.id,
      userEmail: user.email,
      pendingEmail,
    })
  }
}
