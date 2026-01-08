import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RoleManagementService from '#admin/services/role_management_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminRolesDeleteController {
  constructor(
    protected roleManagementService: RoleManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { params, response, session, i18n } = ctx

    try {
      await this.roleManagementService.delete(params.id)
      session.flash('success', i18n.t('admin.roles.deleted'))
      return response.redirect().toRoute('admin.roles.index')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
