import { HttpContext } from '@adonisjs/core/http'
import Token from '#core/models/token'
import vine from '@vinejs/vine'

export default class ResetPasswordController {
  static validator = vine.compile(
    vine.object({
      token: vine.string(),
      password: vine.string().minLength(8).confirmed(),
    })
  )

  async render({ inertia, params, session, response, i18n }: HttpContext) {
    const token = params.token

    const isValid = await Token.verify(token)

    if (!isValid) {
      session.flash('error', i18n.t('auth.reset_password.invalid_token'))
      return response.redirect().toRoute('auth.login')
    }

    return inertia.render('auth/reset_password', { token })
  }

  async execute({ request, response, session, auth, i18n }: HttpContext) {
    const payload = await request.validateUsing(ResetPasswordController.validator)

    const user = await Token.getPasswordResetUser(payload.token)
    if (!user) {
      session.flash('error', i18n.t('auth.reset_password.user_not_found'))
      return response.redirect().toRoute('auth.login')
    }

    await user.merge({ password: payload.password }).save()
    await auth.use('web').login(user)

    session.flash('success', i18n.t('auth.reset_password.success'))

    return response.redirect().toRoute('profile.show')
  }
}
