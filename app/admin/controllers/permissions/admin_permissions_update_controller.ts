import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionManagementService from '#admin/services/permission_management_service'
import AdminPermissionValidators from '#admin/validators/admin_permission_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminPermissionsUpdateController {
  constructor(
    protected permissionManagementService: PermissionManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params, response, session, i18n } = ctx

    try {
      const permission = await this.permissionManagementService.detail(params.id)

      if (!permission.canBeModified) {
        session.flash('error', i18n.t('admin.permissions.cannot_modify_system'))
        return response.redirect().toRoute('admin.permissions.index')
      }

      return inertia.render('admin/permissions/form', { permission })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    try {
      const data = await request.validateUsing(AdminPermissionValidators.update())
      await this.permissionManagementService.update(params.id, data)

      session.flash('success', i18n.t('admin.permissions.updated'))
      return response.redirect().toRoute('admin.permissions.show', { id: params.id })
    } catch (error) {
      return this.errorHandler.handle(ctx, error, [
        {
          code: 'CANNOT_MODIFY_SYSTEM_PERMISSION',
          message: i18n.t('admin.permissions.cannot_modify_system'),
        },
      ])
    }
  }
}
