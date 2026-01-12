import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#admin/services/user_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminUsersShowController {
  constructor(
    protected userManagementService: UserService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    try {
      const user = await this.userManagementService.detail(params.id)
      const roles = await this.userManagementService.getAllRoles()

      return inertia.render('admin/users/show', {
        user,
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          slug: role.slug,
        })),
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
