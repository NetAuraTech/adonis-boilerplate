import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import RoleManagementService from '#admin/services/role_management_service'
import AdminRoleValidators from '#admin/validators/admin_role_validators'
import ErrorHandlerService from '#core/services/error_handler_service'
import { Exception } from '@adonisjs/core/exceptions'

@inject()
export default class AdminRolesUpdateController {
  constructor(
    protected roleManagementService: RoleManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    try {
      const role = await this.roleManagementService.detail(params.id)

      if (!role.canBeModified) {
        throw new Exception('Cannot modify system role', {
          status: 403,
          code: 'CANNOT_MODIFY_SYSTEM_ROLE',
        })
      }

      const permissionsByCategory = await this.roleManagementService.getPermissionsByCategory(
        params.id
      )

      return inertia.render('admin/roles/form', { role, permissionsByCategory })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    try {
      const data = await request.validateUsing(AdminRoleValidators.update())
      await this.roleManagementService.update(params.id, data)

      session.flash('success', i18n.t('admin.roles.updated'))
      return response.redirect().toRoute('admin.roles.show', { id: params.id })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
