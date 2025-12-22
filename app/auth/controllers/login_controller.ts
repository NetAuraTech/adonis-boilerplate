import type { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import { getEnabledProviders } from '#auth/helpers/oauth'

export default class LoginController {
  render({ inertia }: HttpContext) {
    return inertia.render('auth/login', {
      providers: getEnabledProviders(),
    })
  }

  async execute({ auth, request, response, session, i18n }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user, !!request.input('remember_me'))
      session.flash('success', i18n.t('auth.login.success'))
    } catch (error) {
      session.flash('error', i18n.t('auth.login.failed'))
      return response.redirect().toRoute('auth.login')
    }

    return response.redirect().toRoute('profile.show')
  }
}
