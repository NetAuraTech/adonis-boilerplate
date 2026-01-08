import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserManagementService from '#admin/services/user_management_service'
import { extractPagination } from '#core/helpers/pagination'
import AdminUserValidators from '#admin/validators/admin_user_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminUsersIndexController {
  constructor(
    protected userManagementService: UserManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    try {
      const roles = await this.userManagementService.getAllRoles()
      const allowedRoleIds = roles.map((role) => String(role.id))

      const pagination = await extractPagination(request)

      const data = await request.validateUsing(AdminUserValidators.list(allowedRoleIds))

      const users = await this.userManagementService.list({
        page: pagination.page,
        perPage: pagination.perPage,
        search: data.search,
        role: data.role,
      })

      return inertia.render('admin/users/index', {
        users: users.serialize({
          fields: {
            pick: ['id', 'email', 'fullName', 'status', 'createdAt'],
          },
          relations: {
            role: {
              fields: ['id', 'name', 'slug'],
            },
          },
        }),
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
        })),
        filters: {
          search: data.search,
          role: data.role,
        },
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
