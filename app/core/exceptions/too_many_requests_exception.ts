import { Exception } from '@adonisjs/core/exceptions'

export default class TooManyRequestsException extends Exception {
  static status = 429
  static code = 'E_RATE_LIMIT'

  /**
   * @param message - Translated error message (already formatted with minutes)
   * @param retryAfter - Number of seconds before retrying
   * @param retryMinutes - Number of minutes (for API response)
   */
  constructor(
    message: string = 'Too many requests',
    public retryAfter?: number,
    public retryMinutes?: number
  ) {
    super(message, {
      status: TooManyRequestsException.status,
      code: TooManyRequestsException.code,
    })
  }
}
