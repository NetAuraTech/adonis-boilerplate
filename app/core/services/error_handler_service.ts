import { HttpContext } from '@adonisjs/core/http'
import { Sentry } from '@rlanz/sentry'

interface CustomErrorHandler {
  code?: string
  exception?: any
  message: string
  callback?: (ctx: HttpContext) => any
}

export default class ErrorHandlerService {
  async handle(ctx: HttpContext, error: any, customHandlers: CustomErrorHandler[] = []) {
    const { session, response, i18n } = ctx

    if (error.code === 'E_VALIDATION_ERROR') {
      throw error
    }

    for (const handler of customHandlers) {
      const isMatch =
        (handler.code && error.code === handler.code) ||
        (handler.exception && error instanceof handler.exception) ||
        (handler.code && error.message === handler.code)

      if (isMatch) {
        if (handler.callback) return handler.callback(ctx)
        session.flash('error', handler.message)
        return response.redirect().back()
      }
    }

    if (error.code === 'E_ROW_NOT_FOUND') {
      session.flash('error', i18n.t('common.not_found'))
      return response.redirect().back()
    }

    if (error.code === 'E_INVALID_CURRENT_PASSWORD') {
      session.flashExcept(['current_password', 'password', 'password_confirmation'])
      session.flashErrors({ current_password: i18n.t('profile.password.incorrect_current') })
      return response.redirect().back()
    }

    if (error.code === 'E_INVALID_PASSWORD') {
      session.flashExcept(['password'])
      session.flashErrors({ password: i18n.t('profile.password.incorrect_password') })
      return response.redirect().back()
    }

    if (error.code === 'E_EMAIL_NOT_VERIFIED') {
      session.flash('error', i18n.t('auth.verify_email.required'))
      return response.redirect().back()
    }

    Sentry.captureException(error)

    const errorCode = error.code || error.name || 'UNKNOWN'
    session.flash('error', i18n.t('common.unexpected_error', { code: errorCode }))
    return response.redirect().back()
  }
}
