import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import PasswordService from '#auth/services/password_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import AuthValidators from '#auth/validators/auth_validators'

@inject()
export default class ForgotPasswordController {
  constructor(
    protected passwordService: PasswordService,
    protected errorHandler: ErrorHandlerService
  ) {}

  render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      return inertia.render('auth/forgot_password')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    try {
      const payload = await request.validateUsing(AuthValidators.forgotPassword())
      const user = await User.findBy('email', payload.email)

      if (user) {
        await this.passwordService.sendResetPasswordLink(user, i18n)
      }

      session.flash('success', i18n.t('auth.forgot_password.email_sent'))
      return response.redirect().toRoute('auth.login')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
