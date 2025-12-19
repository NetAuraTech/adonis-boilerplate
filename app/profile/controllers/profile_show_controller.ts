import type { HttpContext } from '@adonisjs/core/http'
import { getEnabledProviders } from '#auth/helpers/oauth'
import { UserPresenter } from '#auth/presenters/user_presenter'

export default class ProfileShowController {
  async render({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    // TODO
    // const notifications = await user.related('notifications').query()
    const notifications: any[] = []

    return inertia.render('profile/show', {
      notifications,
      providers: getEnabledProviders(),
      linkedProviders: UserPresenter.getLinkedProviders(user),
    })
  }
}
