import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import Token from '#core/models/token'
import type { HasMany } from '@adonisjs/lucid/types/relations'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  get isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null
  }

  get hasPendingEmailChange(): boolean {
    return this.pendingEmail !== null
  }
}
