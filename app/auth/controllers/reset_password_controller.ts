import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import PasswordService from '#auth/services/password_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import AuthValidators from '#auth/validators/auth_validators'

@inject()
export default class ResetPasswordController {
  constructor(
    protected passwordService: PasswordService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params, i18n } = ctx

    try {
      await this.passwordService.validateResetToken(params.token)

      return inertia.render('auth/reset_password', { token: params.token })
    } catch (error) {
      return this.errorHandler.handle(ctx, error, [
        {
          code: 'E_TOKEN_EXPIRED',
          message: i18n.t('auth.reset_password.invalid_token'),
          callback: ({ response: callback_response, session: callback_session }) => {
            callback_session.flash('error', i18n.t('auth.reset_password.invalid_token'))
            return callback_response.redirect().toRoute('auth.forgot_password')
          },
        },
        {
          code: 'E_MAX_ATTEMPTS_EXCEEDED',
          message: i18n.t('auth.reset_password.max_attempts_exceeded'),
          callback: ({ response: callback_response, session: callback_session }) => {
            callback_session.flash('error', i18n.t('auth.reset_password.max_attempts_exceeded'))
            return callback_response.redirect().toRoute('auth.forgot_password')
          },
        },
      ])
    }
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, auth, i18n } = ctx

    try {
      const payload = await request.validateUsing(AuthValidators.resetPassword())

      const user = await this.passwordService.resetPassword(payload)

      await auth.use('web').login(user)

      session.flash('success', i18n.t('auth.reset_password.success'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error, [
        {
          code: 'E_INVALID_TOKEN',
          message: i18n.t('auth.reset_password.invalid_token'),
          callback: ({ response: callback_response, session: callback_session }) => {
            callback_session.flash('error', i18n.t('auth.reset_password.invalid_token'))
            return callback_response.redirect().toRoute('auth.forgot_password')
          },
        },
        {
          code: 'E_MAX_ATTEMPTS_EXCEEDED',
          message: i18n.t('auth.reset_password.max_attempts_exceeded'),
          callback: ({ response: callback_response, session: callback_session }) => {
            callback_session.flash('error', i18n.t('auth.reset_password.max_attempts_exceeded'))
            return callback_response.redirect().toRoute('auth.forgot_password')
          },
        },
      ])
    }
  }
}
