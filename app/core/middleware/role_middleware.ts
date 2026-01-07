import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Middleware to check if user has one of the required roles
 *
 * Usage:
 * router.get('/admin', [AdminController]).use(middleware.role(['admin']))
 * router.get('/moderator', [ModeratorController]).use(middleware.role(['admin', 'moderator']))
 */
@inject()
export default class RoleMiddleware {
  async handle({ auth }: HttpContext, next: NextFn, options: { roles?: string[] } = {}) {
    const user = auth.user

    if (!user) {
      throw new Exception('Unauthenticated', {
        status: 401,
        code: 'E_UNAUTHORIZED',
      })
    }

    const requiredRoles = options.roles || []

    if (requiredRoles.length === 0) {
      return next()
    }

    const hasRequiredRole = await user.hasAnyRole(requiredRoles)

    if (!hasRequiredRole) {
      throw new Exception('Insufficient permissions', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    await next()
  }
}
