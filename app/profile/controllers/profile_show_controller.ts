import type { HttpContext } from '@adonisjs/core/http'
import { getEnabledProviders } from '#auth/helpers/oauth'
import { UserPresenter } from '#auth/presenters/user_presenter'
import ErrorHandlerService from '#core/services/error_handler_service'
import { inject } from '@adonisjs/core'
import UserPreferenceService from '#profile/services/user_preference_service'

@inject()
export default class ProfileShowController {
  constructor(
    protected errorHandler: ErrorHandlerService,
    protected userPreferenceService: UserPreferenceService
  ) {}

  async render(ctx: HttpContext) {
    const { auth, inertia } = ctx

    try {
      const user = auth.getUserOrFail()

      const notifications = await user.related('notifications').query()

      const preferences = await this.userPreferenceService.getOrCreate(user.id)

      return inertia.render('profile/show', {
        notifications,
        providers: getEnabledProviders(),
        linkedProviders: UserPresenter.getLinkedProviders(user),
        preferences,
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
