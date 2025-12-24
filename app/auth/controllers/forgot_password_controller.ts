import { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import PasswordService from '#auth/services/password_service'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class ForgotPasswordController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().trim().toLowerCase().email(),
    })
  )
  constructor(protected passwordService: PasswordService) {}

  render({ inertia }: HttpContext) {
    return inertia.render('auth/forgot_password')
  }

  async execute({ request, response, session, i18n }: HttpContext) {
    const payload = await request.validateUsing(ForgotPasswordController.validator)
    const user = await User.findBy('email', payload.email)

    if (user) {
      await this.passwordService.sendResetPasswordLink(user)
    }

    session.flash('success', i18n.t('auth.forgot_password.email_sent'))

    return response.redirect().toRoute('auth.login')
  }
}
