import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserManagementService from '#admin/services/user_management_service'
import AdminUserValidators from '#admin/validators/admin_user_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminUsersUpdateController {
  constructor(
    protected userManagementService: UserManagementService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request, params } = ctx
    try {
      const { id } = await request.validateUsing(AdminUserValidators.id(), { data: params })

      const user = await this.userManagementService.detail(id)

      const roles = await this.userManagementService.getAllRoles()

      return inertia.render('admin/users/form', {
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

  async execute(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    try {
      const { id } = await request.validateUsing(AdminUserValidators.id(), { data: params })

      const roles = await this.userManagementService.getAllRoles()
      const allowedRoleIds = roles.map((role) => role.id)

      const data = await request.validateUsing(AdminUserValidators.update(id, allowedRoleIds))

      await this.userManagementService.update(id, data)

      session.flash('success', i18n.t('admin.users.updated'))
      return response.redirect().toRoute('admin.users.show', { id: id })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
