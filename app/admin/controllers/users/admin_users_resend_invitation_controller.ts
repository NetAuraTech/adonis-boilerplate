import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import InvitationService from '#auth/services/invitation_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import User from '#auth/models/user'

@inject()
export default class AdminUsersResendInvitationController {
  constructor(
    protected invitationService: InvitationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { params, response, session, i18n } = ctx

    try {
      const user = await User.findOrFail(params.id)

      if (user.isEmailVerified) {
        session.flash('info', i18n.t('admin.users.user_already_active'))
        return response.redirect().back()
      }

      await this.invitationService.sendInvitation({
        email: user.email,
        fullName: user.fullName || '',
        roleId: user.roleId,
      })

      session.flash('success', i18n.t('admin.users.invitation_resent', { email: user.email }))
      return response.redirect().back()
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
