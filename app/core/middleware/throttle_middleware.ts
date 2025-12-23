import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import RateLimitService from '#core/services/rate_limit_service'
import TooManyRequestsException from '#core/exceptions/too_many_requests_exception'
import logger from '@adonisjs/core/services/logger'
import { inject } from '@adonisjs/core'

export interface ThrottleOptions {
  /**
   * Maximum number of requests allowed
   */
  max: number

  /**
   * Time window in seconds
   */
  window: number

  /**
   * Custom key generator (default: route + IP)
   */
  keyGenerator?: (ctx: HttpContext) => string
}

@inject()
export default class ThrottleMiddleware {
  constructor(protected rateLimitService: RateLimitService) {}

  /**
   * Handle request
   */
  async handle(ctx: HttpContext, next: NextFn, options?: ThrottleOptions) {
    const { max = 60, window = 60, keyGenerator } = options || {}

    const key = keyGenerator ? keyGenerator(ctx) : this.generateKey(ctx)

    const result = await this.rateLimitService.attempt(key, max, window)

    ctx.response.header('X-RateLimit-Limit', max.toString())
    ctx.response.header('X-RateLimit-Remaining', result.remaining.toString())
    ctx.response.header('X-RateLimit-Reset', result.resetAt.toSeconds().toString())

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        ip: ctx.request.ip(),
        route: ctx.request.url(),
        max,
        window,
        retryAfter: result.retryAfter,
      })

      if (ctx.request.header('X-Inertia')) {
        const retryMinutes = result.retryAfter ? Math.ceil(result.retryAfter / 60) : 1

        ctx.session.flash(
          'error',
          ctx.i18n.t('errors.too_many_requests', { minutes: retryMinutes })
        )

        ctx.session.flash('rateLimitRetryAt', result.resetAt.toMillis())

        return ctx.response.redirect().back()
      }

      throw new TooManyRequestsException(
        ctx.i18n.t('errors.too_many_requests', {
          minutes: Math.ceil((result.retryAfter || 60) / 60),
        }),
        result.retryAfter
      )
    }

    await next()
  }

  /**
   * Generate rate limit key from context
   */
  private generateKey(ctx: HttpContext): string {
    const route = ctx.request.url()
    const ip = ctx.request.ip()
    return `throttle:${route}:${ip}`
  }
}
