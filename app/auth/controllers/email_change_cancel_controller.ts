import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailChangeService from '#auth/services/email_change_service'

@inject()
export default class EmailChangeCancelController {
  constructor(protected emailChangeService: EmailChangeService) {}

  /**
   * Cancel pending email change
   */
  async execute({ auth, response, session, i18n }: HttpContext) {
    const user = auth.user!

    if (!user.hasPendingEmailChange) {
      session.flash('info', i18n.t('auth.email_change.no_pending'))
      return response.redirect().back()
    }

    await this.emailChangeService.cancelEmailChange(user)

    session.flash('success', i18n.t('auth.email_change.cancelled'))
    return response.redirect().back()
  }
}
