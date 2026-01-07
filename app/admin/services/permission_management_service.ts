import Permission from '#core/models/permission'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { DEFAULT_PAGINATION } from '#core/helpers/pagination'
import BaseAdminService from '#core/services/base_admin_service'

export interface CreatePermissionData {
  name: string
  category: string
  slug?: string
  description?: string
}

export interface UpdatePermissionData {
  name: string
  category: string
  slug?: string
  description?: string
}

export interface PermissionDetails {
  id: number
  name: string
  slug: string
  category: string
  description: string | null
  isSystem: boolean
  canBeDeleted: boolean
  canBeModified: boolean
  roles: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface PermissionListFilters {
  search?: string
  category?: string
  page?: number
  perPage?: number
}

export default class PermissionManagementService extends BaseAdminService<
  typeof Permission,
  PermissionListFilters,
  CreatePermissionData,
  UpdatePermissionData,
  PermissionDetails
> {
  protected model = Permission

  async list(filters: PermissionListFilters): Promise<ModelPaginatorContract<Permission>> {
    const page = filters.page || DEFAULT_PAGINATION.page
    const perPage = filters.perPage || DEFAULT_PAGINATION.perPage

    let query = Permission.query()
      .preload('roles')
      .orderBy('category', 'asc')
      .orderBy('name', 'asc')

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereILike('name', `%${filters.search}%`)
          .orWhereILike('description', `%${filters.search}%`)
      })
    }

    if (filters.category) {
      query = query.where('category', filters.category)
    }

    return query.paginate(page, perPage)
  }

  async detail(permissionId: number): Promise<PermissionDetails> {
    const permission = await Permission.query()
      .where('id', permissionId)
      .preload('roles')
      .firstOrFail()

    return {
      id: permission.id,
      name: permission.name,
      slug: permission.slug,
      category: permission.category,
      description: permission.description,
      isSystem: permission.isSystem,
      canBeDeleted: permission.canBeDeleted,
      canBeModified: permission.canBeModified,
      roles: permission.roles.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
      })),
    }
  }

  async create(data: CreatePermissionData): Promise<Permission> {
    return Permission.create({
      name: data.name,
      slug: data.slug,
      category: data.category.toLowerCase(),
      description: data.description,
      isSystem: false,
    })
  }

  async update(permissionId: number, data: UpdatePermissionData): Promise<Permission> {
    const permission = await Permission.findOrFail(permissionId)

    if (!permission.canBeModified) {
      throw new Error('CANNOT_MODIFY_SYSTEM_PERMISSION')
    }

    permission.merge({
      name: data.name,
      slug: data.slug,
      category: data.category.toLowerCase(),
      description: data.description,
    })

    await permission.save()
    return permission
  }

  async delete(permissionId: number): Promise<void> {
    const permission = await Permission.query()
      .where('id', permissionId)
      .preload('roles')
      .firstOrFail()

    if (!permission.canBeDeleted) {
      throw new Error('CANNOT_DELETE_SYSTEM_PERMISSION')
    }

    if (permission.roles.length > 0) {
      throw new Error(`PERMISSION_HAS_ROLES:${permission.roles.length}`)
    }

    await permission.delete()
  }

  async getAllCategories(): Promise<string[]> {
    const result = await Permission.query()
      .select('category')
      .groupBy('category')
      .orderBy('category', 'asc')
    return result.map((p) => p.category)
  }
}
