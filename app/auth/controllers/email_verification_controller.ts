import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailVerificationService from '#auth/services/email_verification_service'

@inject()
export default class EmailVerificationController {
  constructor(protected emailVerificationService: EmailVerificationService) {}

  /**
   * Verify email with token
   */
  async execute({ params, response, session, auth, i18n }: HttpContext) {
    const { token } = params

    const user = await this.emailVerificationService.verifyEmail(token)

    if (!user) {
      session.flash('error', i18n.t('auth.verify_email.invalid_token'))
      return response.redirect().toRoute('login')
    }

    if (!auth.user) {
      await auth.use('web').login(user)
    }

    session.flash('success', i18n.t('auth.verify_email.success'))
    return response.redirect().toRoute('profile.show')
  }
}
