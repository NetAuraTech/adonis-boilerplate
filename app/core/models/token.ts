import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#auth/models/user'
import hash from '@adonisjs/core/services/hash'

export const TOKEN_TYPES = {
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
} as const

export default class Token extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare public userId: number | null

  @column()
  declare public type: string

  @column()
  declare public token: string

  @column()
  declare public attempts: number

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
   */
  public static async expirePasswordResetTokens(user: User): Promise<void> {
    await this.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .update({ expiresAt: DateTime.now() })
  }

  /**
   * Get user associated with a valid password reset token
   * Verifies:
   * - Token exists and matches (hashed comparison)
   * - Token is not expired
   * - Token has not exceeded max attempts
   */
  public static async getPasswordResetUser(plainToken: string): Promise<User | undefined> {
    const tokens = await this.query()
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .preload('user')

    for (const token of tokens) {
      const matches = await hash.verify(token.token, plainToken)
      if (matches) {
        if (token.attempts >= this.MAX_RESET_ATTEMPTS) {
          return undefined
        }
        return token.user
      }
    }

    return undefined
  }

  /**
   * Verify token exists, is not expired, and has not exceeded max attempts
   */
  public static async verify(plainToken: string): Promise<boolean> {
    const tokens = await this.query()
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)

    for (const token of tokens) {
      const matches = await hash.verify(token.token, plainToken)
      if (matches) {
        return token.attempts < this.MAX_RESET_ATTEMPTS
      }
    }

    return false
  }

  /**
   * Increment attempts counter for a token
   */
  public static async incrementAttempts(plainToken: string): Promise<void> {
    const tokens = await this.query()
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)

    for (const token of tokens) {
      const matches = await hash.verify(token.token, plainToken)
      if (matches) {
        token.attempts += 1
        await token.save()
        return
      }
    }
  }

  /**
   * Check if token has exceeded max attempts
   */
  public static async hasExceededAttempts(plainToken: string): Promise<boolean> {
    const tokens = await this.query()
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)

    for (const token of tokens) {
      const matches = await hash.verify(token.token, plainToken)
      if (matches) {
        return token.attempts >= this.MAX_RESET_ATTEMPTS
      }
    }

    return false
  }

  static async expireEmailVerificationTokens(user: User): Promise<void> {
    await Token.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .update({ expires_at: DateTime.now() })
  }

  static async getEmailVerificationUser(plainToken: string): Promise<User | undefined> {
    const token = await Token.query()
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!token) {
      return undefined
    }

    const isValid = await hash.verify(token.token, plainToken)
    if (!isValid) {
      return undefined
    }

    return token.user
  }

  static async expireEmailChangeTokens(user: User): Promise<void> {
    await Token.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .update({ expires_at: DateTime.now() })
  }

  static async getEmailChangeUser(plainToken: string): Promise<User | undefined> {
    const token = await Token.query()
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!token) {
      return undefined
    }

    const isValid = await hash.verify(token.token, plainToken)
    if (!isValid) {
      return undefined
    }

    return token.user
  }
}
