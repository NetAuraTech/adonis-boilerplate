import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailChangeService from '#auth/services/email_change_service'
import { regenerateCsrfToken } from '#core/helpers/csrf'

@inject()
export default class EmailChangeController {
  constructor(protected emailChangeService: EmailChangeService) {}

  /**
   * Display email change confirmation page
   */
  render({ inertia, params }: HttpContext) {
    return inertia.render('auth/confirm_email_change', {
      token: params.token,
    })
  }

  /**
   * Confirm email change with token
   */
  async execute({ params, response, session, auth, i18n, request }: HttpContext) {
    const { token } = params

    const user = await this.emailChangeService.confirmEmailChange(token)

    if (!user) {
      session.flash('error', i18n.t('auth.email_change.invalid_token'))
      return response.redirect().toRoute('landing')
    }

    if (!auth.user || auth.user.id !== user.id) {
      await auth.use('web').login(user)
    }

    regenerateCsrfToken({ request, response, session } as HttpContext)

    session.flash('success', i18n.t('auth.email_change.success'))
    return response.redirect().toRoute('profile.show')
  }
}
