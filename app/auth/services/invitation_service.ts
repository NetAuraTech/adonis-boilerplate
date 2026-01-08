import User from '#auth/models/user'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { generateSplitToken } from '#core/helpers/crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import { Exception } from '@adonisjs/core/exceptions'

export interface CreateInvitationData {
  email: string
  fullName?: string
  roleId?: number | null
}

/**
 * Service for handling user invitation workflows
 */
export default class InvitationService {
  /**
   * Create and send user invitation
   *
   * - Creates a new user if they don't exist
   * - Updates existing unverified user if they exist
   * - Generates invitation token using selector/validator pattern
   * - Sends invitation email with link
   *
   * @param data - Invitation data containing email, fullName, and roleId
   * @param i18n - Internationalization instance for translations
   * @returns The created or updated user
   * @throws Exception USER_ALREADY_EXISTS if user exists with verified email
   * @throws Error if email sending fails
   */
  async sendInvitation(data: CreateInvitationData, i18n: any): Promise<User> {
    const existingUser = await User.findBy('email', data.email)
    if (existingUser && existingUser.isEmailVerified) {
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
    const appName = env.get('APP_NAME', 'AdonisJS')

    try {
      await mail.send((message) => {
        message
          .to(data.email)
          .subject(i18n.t('emails.user_invitation.subject', { appName }))
          .htmlView('emails/user_invitation', {
            locale: 'en',
            appName,
            greeting: i18n.t('emails.user_invitation.greeting'),
            intro: i18n.t('emails.user_invitation.intro', { appName }),
            action: i18n.t('emails.user_invitation.action'),
            outro: i18n.t('emails.user_invitation.outro'),
            expiry: i18n.t('emails.user_invitation.expiry', { days: 7 }),
            footer: i18n.t('emails.user_invitation.footer'),
            invitationLink,
          })
      })

      logger.info('User invitation sent', {
        userId: user.id,
        email: data.email,
        roleId: data.roleId,
      })

      return user
    } catch (error) {
      logger.error('Failed to send user invitation', {
        userId: user.id,
        email: data.email,
        error: error.message,
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

    logger.info('User invitation accepted', {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    })

    return user
  }
}
