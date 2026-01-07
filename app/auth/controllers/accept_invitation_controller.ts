import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import InvitationService from '#auth/services/invitation_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import AuthValidators from '#auth/validators/auth_validators'

@inject()
export default class AcceptInvitationController {
  constructor(
    protected invitationService: InvitationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params, session, response, i18n } = ctx

    try {
      const invitationDetails = await this.invitationService.getInvitationDetails(params.token)

      if (!invitationDetails) {
        session.flash('error', i18n.t('auth.invitation.invalid_token'))
        return response.redirect().toRoute('auth.login')
      }

      return inertia.render('auth/accept_invitation', {
        token: params.token,
        email: invitationDetails.email,
        fullName: invitationDetails.fullName,
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, auth, i18n } = ctx

    try {
      const data = await request.validateUsing(AuthValidators.acceptInvitation())

      const user = await this.invitationService.acceptInvitation(
        data.token,
        data.password,
        data.full_name
      )

      if (!user) {
        session.flash('error', i18n.t('auth.invitation.invalid_token'))
        return response.redirect().toRoute('auth.login')
      }

      await auth.use('web').login(user)

      session.flash('success', i18n.t('auth.invitation.success'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
