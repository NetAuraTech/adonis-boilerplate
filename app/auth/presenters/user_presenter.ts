import User from '#auth/models/user'

export interface PermissionData {
  id: number
  name: string
  slug: string
  category: string
}

export interface RoleData {
  id: number
  name: string
  slug: string
  permissions: PermissionData[]
}

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
  role: RoleData | null
}

export interface UserPresenterPublicData extends Omit<
  UserPresenterData,
  'githubId' | 'googleId' | 'facebookId'
> {}

export class UserPresenter {
  static async toJSON(user: User | undefined | null): Promise<UserPresenterData | null> {
    if (!user) return null

    if (!user.$preloaded['role']) {
      await user.loadRoleWithPermissions()
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
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            slug: user.role.slug,
            permissions: user.role.permissions.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              category: p.category,
            })),
          }
        : null,
    }
  }

  static async toPublicJSON(
    user: User | undefined | null
  ): Promise<UserPresenterPublicData | null> {
    const fullData = await this.toJSON(user)
    if (!fullData) return null

    const { githubId, googleId, facebookId, ...publicData } = fullData
    return publicData
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
