import type { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import { getEnabledProviders } from '#auth/helpers/oauth'
import vine from '@vinejs/vine'

export default class LoginController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().trim().toLowerCase().email(),
      password: vine.string(),
      remember_me: vine.boolean().optional(),
    })
  )

  render({ inertia }: HttpContext) {
    return inertia.render('auth/login', {
      providers: getEnabledProviders(),
    })
  }

  async execute({ auth, request, response, session, i18n }: HttpContext) {
    const payload = await request.validateUsing(LoginController.validator)

    try {
      const user = await User.verifyCredentials(payload.email, payload.password)
      await auth.use('web').login(user, payload.remember_me)
      session.flash('success', i18n.t('auth.login.success'))
      return response.redirect().toRoute('profile.show')
    } catch {
      session.flash('error', i18n.t('auth.login.failed'))
      return response.redirect().back()
    }
  }
}
