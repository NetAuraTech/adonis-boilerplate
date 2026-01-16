/**
 * API Error structure matching backend ErrorHandlerService.handleApi()
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    stack?: string
    retryAfter?: number
    retryMinutes?: number
  }
}

/**
 * Custom API Error class
 * Automatically extracts error info from axios error responses
 */
export class ApiError extends Error {
  public code: string
  public status: number
  public details?: any
  public retryAfter?: number
  public retryMinutes?: number

  constructor(error: any) {
    const errorData = error.response?.data?.error
    const message = errorData?.message || error.message || 'An unexpected error occurred'

    super(message)

    this.name = 'ApiError'
    this.code = errorData?.code || 'E_UNKNOWN'
    this.status = error.response?.status || 500
    this.details = errorData?.details
    this.retryAfter = errorData?.retryAfter
    this.retryMinutes = errorData?.retryMinutes

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  /**
   * Check if error is an API error
   */
  static isApiError(error: any): error is ApiError {
    return error instanceof ApiError
  }

  /**
   * Create ApiError from axios error
   */
  static fromAxiosError(error: any): ApiError {
    return new ApiError(error)
  }

  /**
   * Get flash message type based on status code
   */
  getFlashType(): 'error' | 'warning' | 'info' {
    if (this.status >= 500) return 'error'
    if (this.status === 429) return 'warning'
    if (this.status >= 400) return 'error'
    return 'info'
  }
}
