import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateSplitToken } from '#core/helpers/crypto'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import InvitationMail from '#auth/mails/invitation_mail'
import { I18n } from '@adonisjs/i18n'
import { inject } from '@adonisjs/core'
import NotificationService from '#notification/services/notification_service'
import LogService, { LogCategory } from '#core/services/log_service'

export interface CreateInvitationData {
  email: string
  fullName?: string
  roleId?: number | null
}

/**
 * Service for handling user invitation workflows
 */
@inject()
export default class InvitationService {
  constructor(
    protected notificationService: NotificationService,
    protected logService: LogService
  ) {}

  /**
   * Create and send user invitation
   *
   * - Creates a new user if they don't exist
   * - Updates existing unverified user if they exist
   * - Generates invitation token using selector/validator pattern
   * - Sends invitation email with link
   *
   * @param data - Invitation data containing email, fullName, and roleId
   * @param translator
   * @returns The created or updated user
   * @throws Exception USER_ALREADY_EXISTS if user exists with verified email
   * @throws Error if email sending fails
   */
  async sendInvitation(data: CreateInvitationData, translator: I18n): Promise<User> {
    const existingUser = await User.findBy('email', data.email)
    if (existingUser && existingUser.isEmailVerified) {
      this.logService.logAuth('invitation.failed.user_exists', {
        userEmail: data.email,
      })

      throw new Exception('User already exists', {
        status: 409,
        code: 'USER_ALREADY_EXISTS',
      })
    }

    if (existingUser) {
      await Token.query()
        .where('type', TOKEN_TYPES.USER_INVITATION)
        .where('user_id', existingUser.id)
        .delete()
    }

    const user =
      existingUser ||
      (await User.create({
        email: data.email,
        fullName: data.fullName || null,
        password: null,
        roleId: data.roleId || null,
        emailVerifiedAt: null,
      }))

    if (existingUser) {
      user.fullName = data.fullName || user.fullName
      user.roleId = data.roleId !== undefined ? data.roleId : user.roleId
      await user.save()
    }

    const { selector, validator, fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.USER_INVITATION,
      selector: selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const invitationLink = `${env.get('DOMAIN')}/accept-invitation/${fullToken}`

    try {
      await this.notificationService.notify(new InvitationMail(user, invitationLink, translator))

      this.logService.logAuth('invitation.sent', {
        userId: user.id,
        userEmail: data.email,
      })

      return user
    } catch (error) {
      this.logService.error({
        message: 'Failed to send user invitation',
        category: LogCategory.AUTH,
        error,
        context: {
          userId: user.id,
          userEmail: data.email,
        },
      })
      throw error
    }
  }

  /**
   * Get invitation details from token
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns Invitation details if token is valid, null otherwise
   */
  async getInvitationDetails(fullToken: string): Promise<{
    email: string
    fullName: string | null
    roleId: number | null
    userId: number
  } | null> {
    const token = await Token.getUserInvitationToken(fullToken)

    if (!token || !token.userId) {
      this.logService.logAuth('invitation.details.invalid_token', {})
      return null
    }

    const user = await User.findOrFail(token.userId)

    return {
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      userId: user.id,
    }
  }

  /**
   * Accept invitation and activate user
   *
   * - Validates the invitation token
   * - Sets user password
   * - Updates full name if provided
   * - Marks email as verified
   * - Expires all invitation tokens for the user
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @param password - The password to set for the user
   * @param fullName - Optional full name to update
   * @returns User if invitation accepted successfully, null if token is invalid
   */
  async acceptInvitation(
    fullToken: string,
    password: string,
    fullName?: string
  ): Promise<User | null> {
    const invitationDetails = await this.getInvitationDetails(fullToken)

    if (!invitationDetails) {
      return null
    }

    const user = await User.findOrFail(invitationDetails.userId)

    user.password = password
    if (fullName) {
      user.fullName = fullName
    }
    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await Token.expireInviteTokens(user)

    this.logService.logAuth('invitation.accepted', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }
}
