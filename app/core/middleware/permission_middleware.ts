import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to check if user has a specific permission
 *
 * Usage:
 * router.get('/users', [UsersController]).use(middleware.permission(['users.view']))
 * router.post('/users', [UsersController]).use(middleware.permission(['users.create']))
 */
export default class PermissionMiddleware {
  async handle(
    { auth, response, session, i18n }: HttpContext,
    next: NextFn,
    options: { permissions?: string[] } = {}
  ) {
    const user = auth.user

    if (!user) {
      session.flash('error', i18n.t('auth.middleware.unauthenticated'))
      return response.redirect().toRoute('auth.login')
    }

    const requiredPermissions = options.permissions || []

    if (requiredPermissions.length === 0) {
      // No permissions specified, just check if user is authenticated
      return next()
    }

    // Check if user has at least one of the required permissions
    const hasPermission = await Promise.all(
      requiredPermissions.map((permission) => user.can(permission))
    )

    if (!hasPermission.some(Boolean)) {
      session.flash('error', i18n.t('auth.middleware.insufficient_permissions'))
      return response.redirect().toRoute('landing')
    }

    await next()
  }
}
