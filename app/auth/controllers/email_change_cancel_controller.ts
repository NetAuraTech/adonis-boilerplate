import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailChangeService from '#auth/services/email_change_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class EmailChangeCancelController {
  constructor(
    protected emailChangeService: EmailChangeService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, response, session, i18n } = ctx

    try {
      const user = auth.user!

      if (!user.hasPendingEmailChange) {
        session.flash('info', i18n.t('auth.email_change.no_pending'))
        return response.redirect().back()
      }

      await this.emailChangeService.cancelEmailChange(user)

      session.flash('success', i18n.t('auth.email_change.cancelled'))
      return response.redirect().back()
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
