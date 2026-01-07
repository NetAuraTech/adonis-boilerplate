import type { HttpContext } from '@adonisjs/core/http'
import ProfileService from '#profile/services/profile_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import ProfileValidators from '#profile/validators/profile_validators'
import { inject } from '@adonisjs/core'

@inject()
export default class ProfileDeleteController {
  constructor(
    protected profileService: ProfileService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    try {
      const payload = await request.validateUsing(ProfileValidators.deleteProfile())

      const user = auth.getUserOrFail()

      await this.profileService.deleteAccount(user, payload)

      await auth.use('web').logout()

      session.flash('success', i18n.t('profile.delete.success'))

      return response.redirect().toRoute('landing')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
