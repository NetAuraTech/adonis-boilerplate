import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import UserPreferenceService from '#profile/services/user_preference_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import UserPreferenceValidators from '#profile/validators/user_preference_validators'

/**
 * Controller for updating user preferences
 * PATCH /preferences
 */
@inject()
export default class UserPreferenceUpdateController {
  constructor(
    protected preferenceService: UserPreferenceService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(UserPreferenceValidators.update())

      //@ts-ignore
      await this.preferenceService.update(user.id, payload)

      session.flash('success', i18n.t('profile.preferences.success'))

      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
