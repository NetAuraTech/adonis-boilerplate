import User from '#auth/models/user'
import type { AllyUserContract } from '@adonisjs/ally/types'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import Role from '#core/models/role'
import { Exception } from '@adonisjs/core/exceptions'

export default class SocialService {
  async findOrCreateUser(
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<User> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'

    let user = await User.findBy(providerIdColumn, allyUser.id)

    if (user) {
      logger.info('User found by OAuth provider ID', {
        userId: user.id,
        provider,
        providerId: allyUser.id,
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

        logger.info('Existing user linked to OAuth provider', {
          userId: user.id,
          provider,
          providerId: allyUser.id,
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

    logger.info('New user created via OAuth', {
      userId: user.id,
      provider,
      providerId: allyUser.id,
      roleId: user.roleId,
    })

    return user
  }

  /**
   * Links an OAuth account to an existing user
   *
   * @throws Exception E_PROVIDER_ALREADY_LINKED if the OAuth account is already linked to another user
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
      throw new Exception(`This ${provider} account is already linked to another user`, {
        status: 409,
        code: 'E_PROVIDER_ALREADY_LINKED',
      })
    }

    user[providerIdColumn] = allyUser.id
    await user.save()
  }

  async unlinkProvider(user: User, provider: 'github' | 'google' | 'facebook'): Promise<void> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'

    user[providerIdColumn] = null
    await user.save()
  }

  needsPasswordSetup(user: User): boolean {
    const hasSocialAccount = !!(user.githubId || user.googleId || user.facebookId)

    const hasNoPassword = !user.password

    return hasSocialAccount && hasNoPassword
  }
}
