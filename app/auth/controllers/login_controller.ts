import type { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import { getEnabledProviders } from '#auth/helpers/oauth'

export default class LoginController {
  render({ inertia }: HttpContext) {
    return inertia.render('auth/login', {
      providers: getEnabledProviders(),
    })
  }

  async execute({ auth, request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.verifyCredentials(email, password)
    await auth.use('web').login(user, !!request.input('remember_me'))

    return response.redirect().toRoute('landing')
  }
}
