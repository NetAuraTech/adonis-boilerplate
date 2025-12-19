import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileCleanNotificationsController {
  async execute({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    // TODO
    // await user.related('notifications').query().delete()

    session.flash('success', 'Your notifications have been cleared successfully.')

    return response.redirect().toRoute('profile.show')
  }
}
