import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RoleManagementService from '#admin/services/role_management_service'
import { extractPagination } from '#core/helpers/pagination'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminRolesIndexController {
  constructor(
    protected roleManagementService: RoleManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    try {
      const pagination = await extractPagination(request)

      const roles = await this.roleManagementService.list({
        page: pagination.page,
        perPage: pagination.perPage,
      })

      return inertia.render('admin/roles/index', {
        roles: {
          ...roles.serialize({
            fields: {
              pick: [
                'id',
                'name',
                'slug',
                'description',
                'isSystem',
                'canBeDeleted',
                'canBeModified',
              ],
            },
          }),
          data: roles.all().map((role) => ({
            id: role.id,
            name: role.name,
            slug: role.slug,
            description: role.description,
            isSystem: role.isSystem,
            canBeDeleted: role.canBeDeleted,
            canBeModified: role.canBeModified,
            usersCount: role.$extras.users_count,
          })),
        },
        filters: {},
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
