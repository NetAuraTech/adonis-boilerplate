import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class TooManyRequestsException extends Exception {
  static status = 429
  static code = 'E_TOO_MANY_REQUESTS'

  constructor(
    message: string = 'Too many requests',
    public retryAfter?: number
  ) {
    super(message, { status: TooManyRequestsException.status, code: TooManyRequestsException.code })
  }

  /**
   * Handle the exception
   */
  async handle(error: this, ctx: HttpContext) {
    const { response } = ctx

    if (error.retryAfter) {
      response.header('Retry-After', error.retryAfter.toString())
    }

    return response.status(429).json({
      error: {
        code: TooManyRequestsException.code,
        message: error.message,
        retryAfter: error.retryAfter,
      },
    })
  }
}
