import type { HttpContext } from '@adonisjs/core/http'
import { getEnabledProviders } from '#auth/helpers/oauth'
import { UserPresenter } from '#auth/presenters/user_presenter'
import ErrorHandlerService from '#core/services/error_handler_service'
import { inject } from '@adonisjs/core'

@inject()
export default class ProfileShowController {
  constructor(protected errorHandler: ErrorHandlerService) {}

  async render(ctx: HttpContext) {
    const { auth, inertia } = ctx

    try {
      const user = auth.getUserOrFail()

      // TODO
      // const notifications = await user.related('notifications').query()
      const notifications: any[] = []

      return inertia.render('profile/show', {
        notifications,
        providers: getEnabledProviders(),
        linkedProviders: UserPresenter.getLinkedProviders(user),
      })
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
