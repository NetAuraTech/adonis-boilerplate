import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'
import { inject } from '@adonisjs/core'

/**
 * Middleware to check if user has a specific permission
 *
 * Usage:
 * router.get('/users', [UsersController]).use(middleware.permission(['users.view']))
 * router.post('/users', [UsersController]).use(middleware.permission(['users.create']))
 */
@inject()
export default class PermissionMiddleware {
  async handle({ auth }: HttpContext, next: NextFn, options: { permissions?: string[] } = {}) {
    const user = auth.user

    if (!user) {
      throw new Exception('Unauthenticated', {
        status: 401,
        code: 'E_UNAUTHORIZED',
      })
    }

    const requiredPermissions = options.permissions || []

    if (requiredPermissions.length === 0) {
      return next()
    }

    const hasPermission = await Promise.all(
      requiredPermissions.map((permission) => user.can(permission))
    )

    if (!hasPermission.some(Boolean)) {
      throw new Exception('Insufficient permissions', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    await next()
  }
}
