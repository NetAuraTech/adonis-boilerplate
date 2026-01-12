import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#admin/services/permission_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminPermissionsDeleteController {
  constructor(
    protected permissionManagementService: PermissionService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { params, response, session, i18n } = ctx

    try {
      await this.permissionManagementService.delete(params.id)
      session.flash('success', i18n.t('admin.permissions.deleted'))
      return response.redirect().toRoute('admin.permissions.index')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
