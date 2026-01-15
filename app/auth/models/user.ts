import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, computed, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import Token from '#core/models/token'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Role from '#core/models/role'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import UserPreference from '#core/models/user_preference'
import Notification from '#notification/models/notification'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column()
  declare pendingEmail: string | null

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare locale: string | null

  // OAuth provider IDs
  @column()
  declare githubId: string | null

  @column()
  declare googleId: string | null

  @column()
  declare facebookId: string | null

  @hasMany(() => Token)
  declare public tokens: HasMany<typeof Token>

  @hasMany(() => Token, {
    onQuery: (query) => query.where('type', 'PASSWORD_RESET'),
  })
  declare public passwordResetTokens: HasMany<typeof Token>

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification>

  @hasOne(() => UserPreference)
  declare preference: HasOne<typeof UserPreference>

  @column()
  declare roleId: number | null

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  get isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null
  }

  get hasPendingEmailChange(): boolean {
    return this.pendingEmail !== null
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(roleSlug: string): Promise<boolean> {
    if (!this.roleId) return false

    const role = await (this as User).related('role').query().first()
    return role?.slug === roleSlug
  }

  /**
   * Check if user has any of the given roles
   */
  async hasAnyRole(roleSlugs: string[]): Promise<boolean> {
    if (!this.roleId) return false

    const role = await (this as User).related('role').query().first()
    return role ? roleSlugs.includes(role.slug) : false
  }

  /**
   * Check if user has a specific permission
   */
  async can(permissionSlug: string): Promise<boolean> {
    if (!this.roleId) return false

    const role = await (this as User).related('role').query().preload('permissions').first()
    if (!role) return false

    return role.permissions.some((p) => p.slug === permissionSlug)
  }

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin')
  }

  /**
   * Load role with permissions (for optimization)
   */
  async loadRoleWithPermissions(): Promise<void> {
    if (!this.roleId) return
    await (this as User).load('role', (query) => {
      query.preload('permissions')
    })
  }

  /**
   * Check if a user has an active invitation (not yet accepted)
   */
  @computed()
  get status(): string {
    const hasInvitation = this.tokens && this.tokens.length > 0

    if (hasInvitation) {
      return 'PENDING_INVITE'
    }

    if (this.isEmailVerified) {
      return 'VERIFIED'
    }

    return 'UNVERIFIED'
  }
}
