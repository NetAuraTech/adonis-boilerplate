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
  async render({ inertia, params, session, response }: HttpContext) {
    const token = params.token

    const isValid = await Token.verify(token)

    if (!isValid) {
      session.flash('error', 'Your token is invalid or expired. Please try again.')
      return response.redirect().toRoute('auth.login')
    }

    return inertia.render('auth/reset_password', { token })
  }

  async execute({ request, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(ResetPasswordController.validator)

    const user = await Token.getPasswordResetUser(payload.token)
    if (!user) {
      session.flash('error', 'Token expired or associated user could not be found')
      return response.redirect().toRoute('auth.login')
    }

    await user.merge({ password: payload.password }).save()
    await auth.use('web').login(user)

    session.flash('success', 'Your password has been reset successfully.')

    return response.redirect().toRoute('profile.show')
  }
}
