import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserManagementService from '#admin/services/user_management_service'

@inject()
export default class AdminUsersShowController {
  constructor(protected userManagementService: UserManagementService) {}

  async render({ inertia, params }: HttpContext) {
    const user = await this.userManagementService.detail(params.id)
    const roles = await this.userManagementService.getAllRoles()

    return inertia.render('admin/users/show', {
      user,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
      })),
    })
  }
}
