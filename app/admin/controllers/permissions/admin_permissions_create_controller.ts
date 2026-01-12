import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionService from '#admin/services/permission_service'
import AdminPermissionValidators from '#admin/validators/admin_permission_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminPermissionsCreateController {
  constructor(
    protected permissionManagementService: PermissionService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      return inertia.render('admin/permissions/form', { permission: null })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    try {
      const data = await request.validateUsing(AdminPermissionValidators.create())

      const permission = await this.permissionManagementService.create(data)

      session.flash('success', i18n.t('admin.permissions.created'))
      return response.redirect().toRoute('admin.permissions.show', { id: permission.id })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
