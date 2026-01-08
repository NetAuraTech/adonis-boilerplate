import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Guest middleware is used to deny access to routes that should
 * be accessed by unauthenticated users.
 *
 * For example, the login page should not be accessible if the user
 * is already logged-in
 */
export default class GuestMiddleware {
  redirectTo = '/'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    // Debug de sécurité
    if (!ctx.auth) {
      console.error("ERREUR: Le middleware d'Auth n'est pas initialisé. Vérifiez le Kernel.")
      return next()
    }

    // On récupère les guards de manière sécurisée
    const guards =
      options.guards && options.guards.length > 0 ? options.guards : [ctx.auth.defaultGuard]

    for (let guard of guards) {
      console.error('test du guard: ', guard)
      if (await ctx.auth.use(guard).check()) {
        console.error('auth check: ', await ctx.auth.use(guard).check())
        return ctx.response.redirect(this.redirectTo, true)
      }
    }

    return next()
  }
}
