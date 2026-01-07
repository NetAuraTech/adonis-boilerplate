import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailChangeService from '#auth/services/email_change_service'
import { regenerateCsrfToken } from '#core/helpers/csrf'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class EmailChangeController {
  constructor(
    protected emailChangeService: EmailChangeService,
    protected errorHandler: ErrorHandlerService
  ) {}

  render(ctx: HttpContext) {
    const { inertia, params } = ctx

    try {
      return inertia.render('auth/confirm_email_change', {
        token: params.token,
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { params, response, session, auth, i18n } = ctx

    try {
      const user = await this.emailChangeService.confirmEmailChange(params.token)

      if (!user) {
        session.flash('error', i18n.t('auth.email_change.invalid_token'))
        return response.redirect().toRoute('landing')
      }

      if (!auth.user || auth.user.id !== user.id) {
        await auth.use('web').login(user)
      }

      regenerateCsrfToken(ctx)

      session.flash('success', i18n.t('auth.email_change.success'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
