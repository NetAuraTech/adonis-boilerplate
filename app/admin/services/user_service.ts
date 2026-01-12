import User from '#auth/models/user'
import Role from '#core/models/role'
import { DEFAULT_PAGINATION } from '#core/helpers/pagination'
import { TOKEN_TYPES } from '#core/models/token'
import { DateTime } from 'luxon'
import BaseAdminService from '#core/services/base_admin_service'
import InvitationService from '#auth/services/invitation_service'
import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import i18n from 'i18next'

export interface UserListFilters {
  search?: string
  role?: string
  page?: number
  perPage?: number
}

export interface UserDetails {
  id: number
  email: string
  fullName: string | null
  emailVerifiedAt: string | null
  pendingEmail: string | null
  status: string
  role: {
    id: number
    name: string
    slug: string
    permissions: Array<{
      id: number
      name: string
      slug: string
      category: string
    }>
  } | null
  githubId: string | null
  googleId: string | null
  facebookId: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateUserData {
  email: string
  fullName?: string
  role_id?: number | null
}

export interface UpdateUserData {
  email: string
  fullName?: string
  role_id?: number | null
}

@inject()
export default class UserService extends BaseAdminService<
  typeof User,
  UserListFilters,
  CreateUserData,
  UpdateUserData,
  UserDetails
> {
  protected model = User

  constructor(protected invitationService: InvitationService) {
    super()
  }
  async list(filters: UserListFilters) {
    const page = filters.page || DEFAULT_PAGINATION.page
    const perPage = filters.perPage || DEFAULT_PAGINATION.perPage

    let query = User.query()
      .preload('role')
      .preload('tokens', (q) => {
        q.where('type', TOKEN_TYPES.USER_INVITATION).where(
          'expires_at',
          '>',
          DateTime.now().toSQL()
        )
      })
      .orderBy('created_at', 'desc')

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereILike('email', `%${filters.search}%`)
          .orWhereILike('fullName', `%${filters.search}%`)
      })
    }

    if (filters.role) {
      query = query.where('role_id', filters.role)
    }

    return query.paginate(page, perPage)
  }

  async detail(userId: number) {
    const user = await User.query()
      .where('id', userId)
      .preload('role', (query) => {
        query.preload('permissions')
      })
      .preload('tokens', (q) => {
        q.where('type', TOKEN_TYPES.USER_INVITATION).where(
          'expires_at',
          '>',
          DateTime.now().toSQL()
        )
      })
      .firstOrFail()

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerifiedAt: user.emailVerifiedAt?.toISO() || null,
      pendingEmail: user.pendingEmail,
      status: user.status,
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
      githubId: user.githubId,
      googleId: user.googleId,
      facebookId: user.facebookId,
      createdAt: user.createdAt.toISO(),
      updatedAt: user.updatedAt?.toISO() || null,
    }
  }

  async create(data: CreateUserData) {
    return await this.invitationService.sendInvitation(
      {
        email: data.email,
        fullName: data.fullName,
        roleId: data.role_id || null,
      },
      i18n as unknown as I18n
    )
  }
  async update(userId: number, data: UpdateUserData) {
    const user = await User.findOrFail(userId)

    user.merge({
      fullName: data.fullName || user.fullName,
      email: data.email.trim().toLowerCase() || user.email,
      roleId: data.role_id || null,
    })

    await user.save()

    return user
  }

  async delete(userId: number) {
    const user = await User.findOrFail(userId)
    await user.delete()
  }

  async getAllRoles(): Promise<Role[]> {
    return Role.query().orderBy('name', 'asc')
  }
}
