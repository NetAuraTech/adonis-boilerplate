import User from '#auth/models/user'
import string from '@adonisjs/core/helpers/string'
import type { AllyUserContract } from '@adonisjs/ally/types'

export default class SocialService {
  async findOrCreateUser(
    allyUser: AllyUserContract<any>,
    provider: 'github' | 'google' | 'facebook'
  ): Promise<User> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'

    let user = await User.query().where(providerIdColumn, allyUser.id).first()

    if (user) {
      return user
    }

    if (allyUser.email) {
      user = await User.query().where('email', allyUser.email).first()

      if (user) {
        user[providerIdColumn] = allyUser.id
        await user.save()
        return user
      }
    }

    user = await User.create({
      email: allyUser.email!,
      fullName: allyUser.name || allyUser.nickName || null,
      [providerIdColumn]: allyUser.id,
      password: string.generateRandom(32),
    })

    return user
  }

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
      throw new Error(`This ${provider} account is already linked to another user.`)
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
    return !!(user.githubId || user.googleId || user.facebookId)
  }
}
