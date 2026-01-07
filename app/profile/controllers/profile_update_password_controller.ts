import type { HttpContext } from '@adonisjs/core/http'
import { regenerateCsrfToken } from '#core/helpers/csrf'
import ErrorHandlerService from '#core/services/error_handler_service'
import ProfileService from '#profile/services/profile_service'
import ProfileValidators from '#profile/validators/profile_validators'
import { inject } from '@adonisjs/core'

@inject()
export default class ProfileUpdatePasswordController {
  constructor(
    protected profileService: ProfileService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(ProfileValidators.updatePassword())

      await this.profileService.updatePassword(user, payload)

      regenerateCsrfToken(ctx)
      session.flash('success', i18n.t('profile.password.success'))

      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
