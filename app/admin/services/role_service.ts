import Role from '#core/models/role'
import Permission from '#core/models/permission'
import string from '@adonisjs/core/helpers/string'
import { DEFAULT_PAGINATION } from '#core/helpers/pagination'
import BaseAdminService from '#core/services/base_admin_service'
import { Exception } from '@adonisjs/core/exceptions'
import RoleHasUsersException from '#core/exceptions/role_has_users_exception'

export interface CreateRoleData {
  name: string
  description?: string
  permission_ids: number[]
}

export interface UpdateRoleData {
  name: string
  description?: string
  permission_ids: number[]
}

export interface RoleWithPermissions {
  id: number
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  usersCount: number
  canBeDeleted: boolean
  canBeModified: boolean
  permissions?: Array<{
    id: number
    name: string
    slug: string
    category: string
    description: string | null
    isSystem: boolean
    assigned?: boolean
  }>
}

export interface RoleListFilters {
  search?: string
  page?: number
  perPage?: number
}

export default class RoleService extends BaseAdminService<
  typeof Role,
  RoleListFilters,
  CreateRoleData,
  UpdateRoleData,
  RoleWithPermissions
> {
  protected model = Role

  async list(filters: RoleListFilters) {
    const page = filters.page || DEFAULT_PAGINATION.page
    const perPage = filters.perPage || DEFAULT_PAGINATION.perPage

    let query = Role.query().preload('permissions').withCount('users').orderBy('name', 'asc')

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereILike('name', `%${filters.search}%`)
          .orWhereILike('description', `%${filters.search}%`)
      })
    }

    return query.paginate(page, perPage)
  }

  async detail(roleId: number) {
    const role = await Role.query()
      .where('id', roleId)
      .preload('permissions')
      .withCount('users')
      .firstOrFail()

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      usersCount: role.$extras.users_count,
      canBeDeleted: role.canBeDeleted,
      canBeModified: role.canBeModified,
    }
  }

  async create(data: CreateRoleData) {
    const role = await Role.create({
      name: data.name,
      slug: string.slug(data.name, { lower: true }),
      description: data.description,
      isSystem: false,
    })

    await role.syncPermissions(data.permission_ids)

    return role
  }

  async update(roleId: number, data: UpdateRoleData) {
    const role = await Role.findOrFail(roleId)

    if (!role.canBeModified) {
      throw new Exception('Cannot modify system role', {
        status: 403,
        code: 'CANNOT_MODIFY_SYSTEM_ROLE',
      })
    }

    role.merge({
      name: data.name,
      slug: string.slug(data.name, { lower: true }),
      description: data.description,
    })

    await role.save()
    await role.syncPermissions(data.permission_ids)

    return role
  }

  async delete(roleId: number) {
    const role = await Role.query().where('id', roleId).withCount('users').firstOrFail()

    if (!role.canBeDeleted) {
      throw new Exception('Cannot delete system role', {
        status: 403,
        code: 'CANNOT_DELETE_SYSTEM_ROLE',
      })
    }

    if (role.$extras.users_count > 0) {
      throw new RoleHasUsersException(role.$extras.users_count)
    }

    await role.delete()
  }

  async getPermissionsByCategory(roleId?: number): Promise<Record<string, any[]>> {
    let assignedPermissionIds: number[] = []

    if (roleId) {
      const role = await Role.query().where('id', roleId).preload('permissions').firstOrFail()
      assignedPermissionIds = role.permissions.map((p) => p.id)
    }

    const allPermissions = await Permission.query()
      .orderBy('category', 'asc')
      .orderBy('name', 'asc')

    return allPermissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = []
        }
        acc[permission.category].push({
          id: permission.id,
          name: permission.name,
          slug: permission.slug,
          description: permission.description,
          isSystem: permission.isSystem,
          assigned: assignedPermissionIds.includes(permission.id),
        })
        return acc
      },
      {} as Record<string, any[]>
    )
  }
}
