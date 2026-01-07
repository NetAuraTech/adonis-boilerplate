import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Middleware to ensure the user's email is verified
 * Redirects to landing page if email is not verified
 */
@inject()
export default class VerifiedMiddleware {
  async handle({ auth }: HttpContext, next: NextFn) {
    const user = auth.user

    if (!user) {
      throw new Exception('Unauthenticated', {
        status: 401,
        code: 'E_UNAUTHORIZED',
      })
    }

    if (!user.isEmailVerified) {
      throw new Exception('Email not verified', {
        status: 403,
        code: 'E_EMAIL_NOT_VERIFIED',
      })
    }

    await next()
  }
}
