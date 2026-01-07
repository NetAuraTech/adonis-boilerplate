import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PermissionManagementService from '#admin/services/permission_management_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminPermissionsDeleteController {
  constructor(
    protected permissionManagementService: PermissionManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { params, response, session, i18n } = ctx

    try {
      await this.permissionManagementService.delete(params.id)
      session.flash('success', i18n.t('admin.permissions.deleted'))
      return response.redirect().toRoute('admin.permissions.index')
    } catch (error) {
      if (error.message.startsWith('PERMISSION_HAS_ROLES:')) {
        const count = error.message.split(':')[1]
        session.flash('error', i18n.t('admin.permissions.has_roles', { count }))

        return response.redirect().back()
      }

      return this.errorHandler.handle(ctx, error, [
        {
          code: 'CANNOT_DELETE_SYSTEM_PERMISSION',
          message: i18n.t('admin.permissions.cannot_delete_system'),
        },
      ])
    }
  }
}
