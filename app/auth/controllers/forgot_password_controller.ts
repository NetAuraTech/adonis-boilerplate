import { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import PasswordService from '#auth/services/password_service'
import { inject } from '@adonisjs/core'

@inject()
export default class ForgotPasswordController {
  constructor(protected passwordService: PasswordService) {}
  render({ inertia }: HttpContext) {
    return inertia.render('auth/forgot_password')
  }

  async execute({ request, response, session }: HttpContext) {
    const email = request.input('email')
    const user = await User.findBy('email', email)

    if (user) {
      await this.passwordService.sendResetPasswordLink(user)
    }

    session.flash(
      'success',
      'If an account exists for this email, you will receive a reset link shortly.'
    )

    return response.redirect().toRoute('auth.login')
  }
}
