import type { HttpContext } from '@adonisjs/core/http'
import RoleManagementService from '#admin/services/role_management_service'
import { inject } from '@adonisjs/core'
import AdminRoleValidators from '#admin/validators/admin_role_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminRolesCreateController {
  constructor(
    protected roleManagementService: RoleManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      const permissionsByCategory = await this.roleManagementService.getPermissionsByCategory()

      return inertia.render('admin/roles/form', {
        role: null,
        permissionsByCategory,
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    try {
      const data = await request.validateUsing(AdminRoleValidators.create())

      const role = await this.roleManagementService.create(data)

      session.flash('success', i18n.t('admin.roles.created'))
      return response.redirect().toRoute('admin.roles.show', { id: role.id })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
