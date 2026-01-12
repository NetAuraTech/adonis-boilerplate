import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#admin/services/user_service'
import AdminUserValidators from '#admin/validators/admin_user_validators'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminUsersCreateController {
  constructor(
    protected userManagementService: UserService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      const roles = await this.userManagementService.getAllRoles()

      return inertia.render('admin/users/form', {
        user: null,
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
    const { request, response, session, i18n } = ctx

    try {
      const roles = await this.userManagementService.getAllRoles()
      const allowedRoleIds = roles.map((role) => role.id)

      const data = await request.validateUsing(AdminUserValidators.create(allowedRoleIds))

      const user = await this.userManagementService.create(data)

      session.flash('success', i18n.t('admin.users.invitation_sent', { email: data.email }))
      return response.redirect().toRoute('admin.users.show', { id: user.id })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
