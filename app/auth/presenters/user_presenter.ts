import User from '#auth/models/user'

export interface UserPresenterData {
  id: number
  email: string
  fullName: string | null
  locale: string | null
  githubId: string | null
  googleId: string | null
  facebookId: string | null
  emailVerifiedAt: string | null
  pendingEmail: string | null
  createdAt: string
  updatedAt: string | null
}

export class UserPresenter {
  static toJSON(user: User | undefined | null): UserPresenterData | null {
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      locale: user.locale,
      githubId: user.githubId,
      googleId: user.googleId,
      facebookId: user.facebookId,
      emailVerifiedAt: user.emailVerifiedAt?.toISO() || null,
      pendingEmail: user.pendingEmail,
      createdAt: user.createdAt.toISO()!,
      updatedAt: user.updatedAt?.toISO() || null,
    }
  }

  static toPublicJSON(user: User | undefined | null) {
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      locale: user.locale,
      emailVerifiedAt: user.emailVerifiedAt?.toISO() || null,
      pendingEmail: user.pendingEmail,
      createdAt: user.createdAt.toISO()!,
      updatedAt: user.updatedAt?.toISO() || null,
    }
  }

  static hasLinkedProviders(user: User): boolean {
    return !!(user.githubId || user.googleId || user.facebookId)
  }

  static getLinkedProviders(user: User) {
    return {
      github: !!user.githubId,
      google: !!user.googleId,
      facebook: !!user.facebookId,
    }
  }
}
