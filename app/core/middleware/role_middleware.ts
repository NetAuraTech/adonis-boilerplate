import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to check if user has one of the required roles
 *
 * Usage:
 * router.get('/admin', [AdminController]).use(middleware.role(['admin']))
 * router.get('/moderator', [ModeratorController]).use(middleware.role(['admin', 'moderator']))
 */
export default class RoleMiddleware {
  async handle(
    { auth, response, session, i18n }: HttpContext,
    next: NextFn,
    options: { roles?: string[] } = {}
  ) {
    const user = auth.user

    if (!user) {
      session.flash('error', i18n.t('auth.middleware.unauthenticated'))
      return response.redirect().toRoute('auth.login')
    }

    const requiredRoles = options.roles || []

    if (requiredRoles.length === 0) {
      // No roles specified, just check if user is authenticated
      return next()
    }

    // Check if user has any of the required roles
    const hasRequiredRole = await user.hasAnyRole(requiredRoles)

    if (!hasRequiredRole) {
      session.flash('error', i18n.t('auth.middleware.insufficient_permissions'))
      return response.redirect().toRoute('landing')
    }

    await next()
  }
}
