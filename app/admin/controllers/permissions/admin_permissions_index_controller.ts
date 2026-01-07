import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionManagementService from '#admin/services/permission_management_service'
import { extractPagination } from '#core/helpers/pagination'
import AdminPermissionValidators from '#admin/validators/admin_permission_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminPermissionsIndexController {
  constructor(
    protected permissionManagementService: PermissionManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    try {
      const pagination = await extractPagination(request)

      const data = await request.validateUsing(AdminPermissionValidators.list())

      const categories = await this.permissionManagementService.getAllCategories()

      const permissions = await this.permissionManagementService.list({
        page: pagination.page,
        perPage: pagination.perPage,
        search: data.search,
        category: data.category,
      })

      return inertia.render('admin/permissions/index', {
        permissions: {
          ...permissions.serialize({
            fields: {
              pick: [
                'id',
                'name',
                'slug',
                'category',
                'description',
                'isSystem',
                'canBeDeleted',
                'canBeModified',
              ],
            },
          }),
          data: permissions.all().map((permission) => ({
            id: permission.id,
            name: permission.name,
            slug: permission.slug,
            category: permission.category,
            description: permission.description,
            isSystem: permission.isSystem,
            canBeDeleted: permission.canBeDeleted,
            canBeModified: permission.canBeModified,
            rolesCount: permission.roles.length,
          })),
        },
        categories,
        filters: {
          search: data.search,
          category: data.category,
        },
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
