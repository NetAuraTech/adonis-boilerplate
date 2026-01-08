import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { getEnabledProviders } from '#auth/helpers/oauth'
import AuthService from '#auth/services/auth_service'
import EmailVerificationService from '#auth/services/email_verification_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import logger from '@adonisjs/core/services/logger'
import AuthValidators from '#auth/validators/auth_validators'

@inject()
export default class RegisterController {
  constructor(
    protected authService: AuthService,
    protected emailVerificationService: EmailVerificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      return inertia.render('auth/register', {
        providers: getEnabledProviders(),
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, auth } = ctx

    try {
      const payload = await request.validateUsing(AuthValidators.register())

      const user = await this.authService.register(payload)

      await auth.use('web').login(user)

      this.emailVerificationService.sendVerificationEmail(user).catch((error) => {
        logger.error('Failed to send verification email', {
          userId: user.id,
          error: error.message,
        })
      })

      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
