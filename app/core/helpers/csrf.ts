import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

/**
 * Regenerate CSRF token after sensitive actions
 * Should be called after:
 * - Login
 * - Password change
 * - Email change
 * - Account deletion (before logout)
 * - OAuth linking/unlinking
 */
export function regenerateCsrfToken(ctx: HttpContext): void {
  try {
    ctx.session.regenerate()

    logger.info('CSRF token regenerated', {
      userId: ctx.auth.user?.id,
      ip: ctx.request.ip(),
    })
  } catch (error) {
    logger.error('Failed to regenerate CSRF token', { error })
  }
}

/**
 * Verify CSRF token manually (for extra sensitive routes)
 * Shield already does this automatically, but this can be used
 * for additional verification in critical controllers
 */
export async function verifyCsrfToken(ctx: HttpContext): Promise<boolean> {
  try {
    const token = ctx.request.input('_csrf') || ctx.request.header('x-csrf-token')

    if (!token) {
      logger.warn('CSRF token missing', {
        url: ctx.request.url(),
        ip: ctx.request.ip(),
      })
      return false
    }

    logger.debug('CSRF token verified', {
      url: ctx.request.url(),
      userId: ctx.auth.user?.id,
    })

    return true
  } catch (error) {
    logger.error('CSRF token verification failed', { error })
    return false
  }
}
