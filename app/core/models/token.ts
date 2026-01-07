import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#auth/models/user'
import hash from '@adonisjs/core/services/hash'
import { splitToken } from '#core/helpers/crypto'

export const TOKEN_TYPES = {
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
  USER_INVITATION: 'USER_INVITATION',
} as const

interface TokenMetadata {
  email?: string
  fullName?: string | null
  roleId?: number | null
}

/**
 * Token model for managing user authentication tokens
 *
 * Uses selector/validator pattern for secure token storage:
 * - selector: stored in plain text for efficient database lookup
 * - token: hashed validator for security verification
 */
export default class Token extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare public userId: number | null

  @column()
  declare public type: string

  /**
   * Selector part of the token (stored in plain text for lookup)
   */
  @column()
  declare public selector: string | null

  /**
   * Hashed validator part of the token
   */
  @column()
  declare public token: string

  @column()
  declare public attempts: number

  @column()
  declare metadata: TokenMetadata | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare public user: BelongsTo<typeof User>

  /**
   * Maximum attempts allowed for password reset tokens
   */
  static readonly MAX_RESET_ATTEMPTS = 3

  /**
   * Expire all password reset tokens for a user
   *
   * @param user - The user whose tokens should be expired
   */
  public static async expirePasswordResetTokens(user: User): Promise<void> {
    await this.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .update({ expiresAt: DateTime.now() })
  }

  /**
   * Get user associated with a valid password reset token
   *
   * Verifies:
   * - Token exists (using selector for lookup)
   * - Token matches (hashed validator comparison)
   * - Token is not expired
   * - Token has not exceeded max attempts
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns User if token is valid, undefined otherwise
   */
  public static async getPasswordResetUser(fullToken: string): Promise<User | undefined> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return undefined
    }

    const { selector, validator } = parts

    const token = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .preload('user')
      .first()

    if (!token) {
      return undefined
    }

    const matches = await hash.verify(token.token, validator)
    if (!matches) {
      return undefined
    }

    if (token.attempts >= this.MAX_RESET_ATTEMPTS) {
      return undefined
    }

    return token.user
  }

  /**
   * Verify token exists, is not expired, and has not exceeded max attempts
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns True if token is valid, false otherwise
   */
  public static async verify(fullToken: string): Promise<boolean> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return false
    }

    const { selector, validator } = parts

    const token = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!token) {
      return false
    }

    const matches = await hash.verify(token.token, validator)
    if (!matches) {
      return false
    }

    return token.attempts < this.MAX_RESET_ATTEMPTS
  }

  /**
   * Increment attempts counter for a token
   *
   * Used to track failed password reset attempts and prevent brute force attacks
   *
   * @param fullToken - Complete token in format "selector.validator"
   */
  public static async incrementAttempts(fullToken: string): Promise<void> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return
    }

    const { selector, validator } = parts

    const token = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!token) {
      return
    }

    const matches = await hash.verify(token.token, validator)
    if (matches) {
      token.attempts += 1
      await token.save()
    }
  }

  /**
   * Check if token has exceeded max attempts
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns True if attempts exceeded, false otherwise
   */
  public static async hasExceededAttempts(fullToken: string): Promise<boolean> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return false
    }

    const { selector, validator } = parts

    const token = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!token) {
      return false
    }

    const matches = await hash.verify(token.token, validator)
    if (!matches) {
      return false
    }

    return token.attempts >= this.MAX_RESET_ATTEMPTS
  }

  /**
   * Expire all email verification tokens for a user
   *
   * @param user - The user whose tokens should be expired
   */
  static async expireEmailVerificationTokens(user: User): Promise<void> {
    await Token.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .update({ expires_at: DateTime.now() })
  }

  /**
   * Get user associated with a valid email verification token
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns User if token is valid, undefined otherwise
   */
  static async getEmailVerificationUser(fullToken: string): Promise<User | undefined> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return undefined
    }

    const { selector, validator } = parts

    const token = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!token) {
      return undefined
    }

    const isValid = await hash.verify(token.token, validator)
    if (!isValid) {
      return undefined
    }

    return token.user
  }

  /**
   * Expire all email change tokens for a user
   *
   * @param user - The user whose tokens should be expired
   */
  static async expireEmailChangeTokens(user: User): Promise<void> {
    await Token.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .update({ expires_at: DateTime.now() })
  }

  /**
   * Get user associated with a valid email change token
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns User if token is valid, undefined otherwise
   */
  static async getEmailChangeUser(fullToken: string): Promise<User | undefined> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return undefined
    }

    const { selector, validator } = parts

    const token = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!token) {
      return undefined
    }

    const isValid = await hash.verify(token.token, validator)
    if (!isValid) {
      return undefined
    }

    return token.user
  }

  /**
   * Get invitation token (uses selector for unique identification)
   *
   * @param fullToken - Complete token in format "selector.validator"
   * @returns Token if valid, null otherwise
   */
  static async getUserInvitationToken(fullToken: string): Promise<Token | null> {
    const parts = splitToken(fullToken)
    if (!parts) {
      return null
    }

    const { selector, validator } = parts

    const token = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .where('expires_at', '>', DateTime.now().toSQL())
      .whereNotNull('user_id')
      .first()

    if (!token) {
      return null
    }

    const isValid = await hash.verify(token.token, validator)
    if (!isValid) {
      return null
    }

    return token
  }

  /**
   * Expire all invite tokens for a user
   *
   * @param user - The user whose invite tokens should be expired
   */
  public static async expireInviteTokens(user: User): Promise<void> {
    await this.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .update({ expiresAt: DateTime.now() })
  }
}
