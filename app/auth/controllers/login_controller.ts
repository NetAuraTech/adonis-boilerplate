import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { getEnabledProviders } from '#auth/helpers/oauth'
import { regenerateCsrfToken } from '#core/helpers/csrf'
import AuthService from '#auth/services/auth_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import AuthValidators from '#auth/validators/auth_validators'

@inject()
export default class LoginController {
  constructor(
    protected authService: AuthService,
    protected errorHandler: ErrorHandlerService
  ) {}

  render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      return inertia.render('auth/login', {
        providers: getEnabledProviders(),
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, auth, i18n } = ctx

    try {
      const payload = await request.validateUsing(AuthValidators.login())

      const user = await this.authService.login(payload.email, payload.password)

      await auth.use('web').login(user, payload.remember_me)
      regenerateCsrfToken(ctx)

      session.flash('success', i18n.t('auth.login.success'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
