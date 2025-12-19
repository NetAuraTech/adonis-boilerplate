import type { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import { getEnabledProviders } from '#auth/helpers/oauth'

export default class LoginController {
  render({ inertia }: HttpContext) {
    return inertia.render('auth/login', {
      providers: getEnabledProviders(),
    })
  }

  async execute({ auth, request, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user, !!request.input('remember_me'))
      session.flash('success', 'You have been successfully logged in.')
    } catch (error) {
      session.flash('error', 'Authentication failed. Please try again.')
      return response.redirect().toRoute('auth.login')
    }

    return response.redirect().toRoute('profile.show')
  }
}
