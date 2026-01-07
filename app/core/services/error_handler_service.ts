import { HttpContext } from '@adonisjs/core/http'
import { Sentry } from '@rlanz/sentry'
import logger from '@adonisjs/core/services/logger'

interface CustomErrorHandler {
  code?: string
  exception?: any
  message?: string
  callback?: (ctx: HttpContext) => any
}

/**
 * Centralized error handling service for Web and API
 *
 * - handle(): Handles errors for Web requests (redirects + flash messages)
 * - handleApi(): Handles errors for API requests (JSON responses)
 */
export default class ErrorHandlerService {
  /**
   * Handles an error for a WEB request
   * Redirects with flash messages
   */
  async handle(
    ctx: HttpContext,
    error: any,
    customHandlers: CustomErrorHandler[] = []
  ): Promise<any> {
    const { session, response, i18n } = ctx

    if (error.code === 'E_VALIDATION_ERROR') {
      throw error
    }

    if (error.retryAfter) {
      response.header('Retry-After', error.retryAfter.toString())
    }

    const customHandler = this.findMatchingHandler(error, customHandlers)
    if (customHandler) {
      if (customHandler.callback) {
        return customHandler.callback(ctx)
      }
      const message = customHandler.message || i18n.t('common.unexpected_error')
      session.flash('error', message)
      return response.redirect().back()
    }

    const commonError = this.handleCommonErrors(error, i18n)
    if (commonError) {
      session.flash('error', commonError.message)

      if (commonError.redirectTo) {
        return response.redirect().toRoute(commonError.redirectTo)
      }

      return response.redirect().back()
    }

    this.logError(ctx, error)
    Sentry.captureException(error)

    const errorCode = error.code || error.name || 'UNKNOWN'
    session.flash('error', i18n.t('common.unexpected_error', { code: errorCode }))
    return response.redirect().back()
  }

  /**
   * Handles an error for an API request
   * Returns a JSON response with the same level of detail as handle()
   */
  async handleApi(
    ctx: HttpContext,
    error: any,
    customHandlers: CustomErrorHandler[] = []
  ): Promise<any> {
    const { response, i18n } = ctx

    if (error.code === 'E_VALIDATION_ERROR') {
      return response.status(422).json({
        error: {
          code: 'E_VALIDATION_ERROR',
          message: i18n.t('validation.failed'),
          details: error.messages || [],
        },
      })
    }

    if (error.retryAfter) {
      response.header('Retry-After', error.retryAfter.toString())
    }

    const customHandler = this.findMatchingHandler(error, customHandlers)
    if (customHandler) {
      if (customHandler.callback) {
        return customHandler.callback(ctx)
      }

      const status = error.status || 400
      return response.status(status).json({
        error: {
          code: error.code || 'E_CUSTOM_ERROR',
          message: customHandler.message || i18n.t('common.unexpected_error'),
        },
      })
    }

    const commonError = this.handleCommonErrors(error, i18n)
    if (commonError) {
      const responseData: any = {
        error: {
          code: commonError.code,
          message: commonError.message,
        },
      }

      if (error.code === 'E_RATE_LIMIT') {
        if (error.retryAfter) {
          responseData.error.retryAfter = error.retryAfter
        }
        if (error.retryMinutes) {
          responseData.error.retryMinutes = error.retryMinutes
        }
      }

      return response.status(commonError.status).json(responseData)
    }

    this.logError(ctx, error)

    const status = error.status || 500
    if (status >= 500) {
      Sentry.captureException(error)
    }

    return response.status(status).json({
      error: {
        code: error.code || 'E_UNKNOWN',
        message: error.message || i18n.t('common.unexpected_error'),
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          details: error.details,
        }),
      },
    })
  }

  /**
   * Finds a handler corresponding to the error
   */
  private findMatchingHandler(
    error: any,
    handlers: CustomErrorHandler[]
  ): CustomErrorHandler | null {
    for (const handler of handlers) {
      const isMatch =
        (handler.code && error.code === handler.code) ||
        (handler.exception && error instanceof handler.exception) ||
        (handler.message && error.message === handler.message)

      if (isMatch) {
        return handler
      }
    }
    return null
  }

  /**
   * Handles common application errors
   * Returns a standardized object usable for web or API
   */
  private handleCommonErrors(
    error: any,
    i18n: any
  ): { code: string; message: string; status: number; redirectTo?: string } | null {
    if (error.code === 'E_RATE_LIMIT' && error.message) {
      return {
        code: 'E_RATE_LIMIT',
        message: error.message,
        status: 429,
      }
    }

    const errorMap: Record<string, { message: string; status: number; redirectTo?: string }> = {
      E_ROW_NOT_FOUND: {
        message: i18n.t('common.not_found'),
        status: 404,
      },
      E_INVALID_CURRENT_PASSWORD: {
        message: i18n.t('profile.password.incorrect_current'),
        status: 400,
      },
      E_INVALID_PASSWORD: {
        message: i18n.t('profile.password.incorrect_password'),
        status: 400,
      },
      E_EMAIL_NOT_VERIFIED: {
        message: i18n.t('auth.verify_email.required'),
        status: 403,
      },
      E_INVALID_CREDENTIALS: {
        message: i18n.t('auth.login.failed'),
        status: 401,
      },
      E_INVALID_TOKEN: {
        message: i18n.t('auth.token.invalid'),
        status: 400,
        redirectTo: 'auth.login',
      },
      E_TOKEN_EXPIRED: {
        message: i18n.t('auth.token.invalid'),
        status: 400,
        redirectTo: 'auth.login',
      },
      E_MAX_ATTEMPTS_EXCEEDED: {
        message: i18n.t('common.rate_limit_exceeded'),
        status: 429,
      },
      E_UNAUTHORIZED: {
        message: i18n.t('common.unauthorized'),
        status: 401,
        redirectTo: 'auth.login',
      },
      E_FORBIDDEN: {
        message: i18n.t('common.forbidden'),
        status: 403,
      },
      USER_ALREADY_EXISTS: {
        message: i18n.t('admin.users.user_already_exists'),
        status: 409,
      },
      E_EMAIL_EXISTS: {
        message: i18n.t('admin.users.user_already_exists'),
        status: 409,
      },
      E_EMAIL_SEND_FAILED: {
        message: i18n.t('auth.verify_email.send_failed'),
        status: 500,
      },
      E_PROVIDER_NOT_CONFIGURED: {
        message: i18n.t('auth.social.not_configured'),
        status: 400,
      },
      E_PROVIDER_ALREADY_LINKED: {
        message: i18n.t('auth.social.already_linked'),
        status: 409,
      },
      E_CSRF_TOKEN_MISMATCH: {
        message: i18n.t('common.csrf_token_mismatch'),
        status: 419,
      },
    }

    const errorInfo = errorMap[error.code] || errorMap[error.message]
    if (errorInfo) {
      return {
        code: error.code || error.message,
        ...errorInfo,
      }
    }

    if (error.status === 401) {
      return {
        code: 'E_UNAUTHORIZED',
        message: i18n.t('common.unauthorized'),
        status: 401,
        redirectTo: 'auth.login',
      }
    }

    if (error.status === 403) {
      return {
        code: 'E_FORBIDDEN',
        message: i18n.t('common.forbidden'),
        status: 403,
      }
    }

    return null
  }

  /**
   * Log an error with context
   */
  private logError(ctx: HttpContext, error: any): void {
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status,
      url: ctx.request.url(),
      method: ctx.request.method(),
      userId: ctx.auth.user?.id,
      ip: ctx.request.ip(),
    })
  }

  /**
   * Helper to determine if a request is waiting for JSON
   */
  isApiRequest(ctx: HttpContext): boolean {
    const acceptHeader = ctx.request.header('accept') || ''
    const contentType = ctx.request.header('content-type') || ''

    return (
      acceptHeader.includes('application/json') ||
      contentType.includes('application/json') ||
      ctx.request.url().startsWith('/api/')
    )
  }
}
