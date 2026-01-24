import User from '#auth/models/user'
import type { AllyUserContract } from '@adonisjs/ally/types'
import { DateTime } from 'luxon'
import Role from '#core/models/role'
import ProviderAlreadyLinkedException from '#core/exceptions/provider_already_linked_exception'
import { inject } from '@adonisjs/core'
import LogService from '#core/services/log_service'

@inject()
export default class SocialService {
  constructor(protected logService: LogService) {}

  async findOrCreateUser(
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<User> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'

    let user = await User.findBy(providerIdColumn, allyUser.id)

    if (user) {
      this.logService.logAuth('social.login', {
        userId: user.id,
        userEmail: user.email,
      })
      return user
    }

    if (allyUser.email) {
      user = await User.findBy('email', allyUser.email)

      if (user) {
        user[providerIdColumn] = allyUser.id

        if (!user.emailVerifiedAt) {
          user.emailVerifiedAt = DateTime.now()
        }

        await user.save()

        this.logService.logAuth('social.linked', {
          userId: user.id,
          userEmail: user.email,
        })

        return user
      }
    }

    const userRole = await Role.findBy('slug', 'user')

    user = await User.create({
      email: allyUser.email || `${provider}_${allyUser.id}@noemail.local`,
      fullName: allyUser.name || allyUser.nickName,
      [providerIdColumn]: allyUser.id,
      emailVerifiedAt: DateTime.now(),
      roleId: userRole?.id || null,
    })

    this.logService.logAuth('social.registered', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }

  /**
   * Links an OAuth account to an existing user
   *
   * @throws Exception ProviderAlreadyLinkedException if the OAuth account is already linked to another user
   */
  async linkProvider(
    user: User,
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<void> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'

    const existingUser = await User.query()
      .where(providerIdColumn, allyUser.id)
      .whereNot('id', user.id)
      .first()

    if (existingUser) {
      this.logService.logSecurity('Attempt to link already linked provider', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new ProviderAlreadyLinkedException(provider)
    }

    user[providerIdColumn] = allyUser.id
    await user.save()

    this.logService.logAuth('social.provider_linked', {
      userId: user.id,
      userEmail: user.email,
    })
  }

  async unlinkProvider(user: User, provider: 'github' | 'google' | 'facebook'): Promise<void> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'

    user[providerIdColumn] = null
    await user.save()

    this.logService.logAuth('social.provider_unlinked', {
      userId: user.id,
      userEmail: user.email,
    })
  }

  needsPasswordSetup(user: User): boolean {
    const hasSocialAccount = !!(user.githubId || user.googleId || user.facebookId)

    const hasNoPassword = !user.password

    return hasSocialAccount && hasNoPassword
  }
}
