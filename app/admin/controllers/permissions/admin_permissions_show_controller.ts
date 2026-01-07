import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionManagementService from '#admin/services/permission_management_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminPermissionsShowController {
  constructor(
    protected permissionManagementService: PermissionManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    try {
      const permission = await this.permissionManagementService.detail(params.id)

      return inertia.render('admin/permissions/show', { permission })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
