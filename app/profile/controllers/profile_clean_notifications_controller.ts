import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileCleanNotificationsController {
  async execute({ auth, response, session, i18n }: HttpContext) {
    const user = auth.getUserOrFail()

    // TODO
    // await user.related('notifications').query().delete()

    session.flash('success', i18n.t('profile.notifications.cleared'))

    return response.redirect().toRoute('profile.show')
  }
}
