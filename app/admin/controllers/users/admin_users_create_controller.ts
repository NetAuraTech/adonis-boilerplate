import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserManagementService from '#admin/services/user_management_service'
import AdminUserValidators from '#admin/validators/admin_user_validators'

@inject()
export default class AdminUsersCreateController {
  constructor(protected userManagementService: UserManagementService) {}

  async render({ inertia }: HttpContext) {
    const roles = await this.userManagementService.getAllRoles()

    return inertia.render('admin/users/form', {
      user: null,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
      })),
    })
  }

  async execute({ request, response, session, i18n }: HttpContext) {
    try {
      const roles = await this.userManagementService.getAllRoles()
      const allowedRoleIds = roles.map((role) => role.id)

      const data = await request.validateUsing(AdminUserValidators.create(allowedRoleIds))

      const user = await this.userManagementService.create(data)

      session.flash('success', i18n.t('admin.users.invitation_sent', { email: data.email }))
      return response.redirect().toRoute('admin.users.show', { id: user.id })
    } catch (error) {
      if (error.message === 'USER_ALREADY_EXISTS') {
        session.flash('error', i18n.t('admin.users.user_already_exists'))
      } else {
        session.flash('error', i18n.t('admin.users.invitation_failed'))
      }
      return response.redirect().back()
    }
  }
}
