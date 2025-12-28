import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to ensure the user's email is verified
 * Redirects to landing page if email is not verified
 */
export default class VerifiedMiddleware {
  async handle({ auth, response, session, i18n }: HttpContext, next: NextFn) {
    const user = auth.user

    if (!user) {
      session.flash('error', i18n.t('auth.middleware.unauthenticated'))
      return response.redirect().toRoute('auth.login')
    }

    if (!user.isEmailVerified) {
      session.flash('warning', i18n.t('auth.verify_email.required'))
      return response.redirect().toRoute('profile.show')
    }

    await next()
  }
}
