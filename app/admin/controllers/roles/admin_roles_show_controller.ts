import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RoleManagementService from '#admin/services/role_management_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminRolesShowController {
  constructor(
    protected roleManagementService: RoleManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    try {
      const role = await this.roleManagementService.detail(params.id)
      const permissionsByCategory = await this.roleManagementService.getPermissionsByCategory(
        params.id
      )

      return inertia.render('admin/roles/show', {
        role,
        permissionsByCategory,
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
