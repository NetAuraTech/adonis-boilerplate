import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#auth/services/auth_service'
import ErrorHandlerService from '#core/services/error_handler_service'

@inject()
export default class LogoutController {
  constructor(
    protected authService: AuthService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, response } = ctx

    try {
      const userId = auth.user?.id

      await auth.use('web').logout()

      if (userId) {
        await this.authService.logout(userId)
      }

      return response.redirect().toRoute('auth.login')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
