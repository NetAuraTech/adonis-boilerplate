import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class CsrfTokenMismatchException extends Exception {
  static status = 419
  static code = 'E_CSRF_TOKEN_MISMATCH'

  constructor(message: string = 'CSRF token mismatch') {
    super(message, {
      status: CsrfTokenMismatchException.status,
      code: CsrfTokenMismatchException.code,
    })
  }

  /**
   * Handle the exception
   */
  async handle(error: this, ctx: HttpContext) {
    const { response, inertia, session, i18n, request } = ctx

    logger.warn('CSRF token mismatch detected', {
      ip: request.ip(),
      url: request.url(),
      method: request.method(),
      userAgent: request.header('user-agent'),
      referer: request.header('referer'),
    })

    if (request.header('X-Inertia')) {
      session.flash('error', i18n.t('errors.csrf_token_mismatch'))
      return inertia.render('errors/csrf_token_mismatch', {
        error: {
          message: error.message,
        },
      })
    }

    return response.status(419).json({
      error: {
        code: CsrfTokenMismatchException.code,
        message: error.message,
      },
    })
  }
}
