import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Sentry } from '@rlanz/sentry'

export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    if (ctx.auth.isAuthenticated) {
      const user = ctx.auth.getUserOrFail()

      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.fullName ?? '',
      })
    }

    return next()
  }
}
