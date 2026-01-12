import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserService from '#admin/services/user_service'
import AdminUserValidators from '#admin/validators/admin_user_validators'
import ActionForbiddenException from '#core/exceptions/action_forbidden_exception'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class AdminUsersDeleteController {
  constructor(
    protected userManagementService: UserService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { params, request, response, session, i18n, auth } = ctx

    const data = await request.validateUsing(AdminUserValidators.id(), { data: params })

    try {
      if (data.id === auth.user!.id) {
        throw new ActionForbiddenException('CANNOT_SELF_DELETE')
      }

      await this.userManagementService.delete(data.id)
      session.flash('success', i18n.t('admin.users.deleted'))
      return response.redirect().toRoute('admin.users.index')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
