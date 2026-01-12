import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailVerificationService from '#auth/services/email_verification_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class EmailResendController {
  constructor(
    protected emailVerificationService: EmailVerificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, response, session, i18n } = ctx

    try {
      const user = auth.user!

      if (user.isEmailVerified) {
        session.flash('info', i18n.t('auth.verify_email.already_verified'))
        return response.redirect().back()
      }

      await this.emailVerificationService.sendVerificationEmail(user, i18n)
      session.flash('success', i18n.t('auth.verify_email.email_sent'))

      return response.redirect().back()
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
