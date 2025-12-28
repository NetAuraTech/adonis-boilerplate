import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmailVerificationService from '#auth/services/email_verification_service'

@inject()
export default class EmailResendController {
  constructor(protected emailVerificationService: EmailVerificationService) {}

  /**
   * Resend verification email
   */
  async execute({ auth, response, session, i18n }: HttpContext) {
    const user = auth.user!

    if (user.isEmailVerified) {
      session.flash('info', i18n.t('auth.verify_email.already_verified'))
      return response.redirect().back()
    }

    try {
      await this.emailVerificationService.sendVerificationEmail(user, i18n)
      session.flash('success', i18n.t('auth.verify_email.email_sent'))
    } catch (error) {
      session.flash('error', i18n.t('auth.verify_email.send_failed'))
    }

    return response.redirect().back()
  }
}
