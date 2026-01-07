import type { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'
import { getEnabledProviders } from '#auth/helpers/oauth'
import EmailVerificationService from '#auth/services/email_verification_service'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import Role from '#core/models/role'

@inject()
export default class RegisterController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().trim().toLowerCase().email().unique(unique('users', 'email')),
      password: vine.string().minLength(8).confirmed(),
    })
  )

  constructor(protected emailVerificationService: EmailVerificationService) {}
  render({ inertia }: HttpContext) {
    return inertia.render('auth/register', {
      providers: getEnabledProviders(),
    })
  }

  async execute({ auth, request, response, i18n }: HttpContext) {
    const payload = await request.validateUsing(RegisterController.validator)

    const userRole = await Role.findBy('slug', 'user')

    const user = await User.create({
      ...payload,
      roleId: userRole?.id || null,
    })

    await auth.use('web').login(user)

    this.emailVerificationService.sendVerificationEmail(user, i18n).catch((error) => {
      logger.error('Failed to send verification email after registration', {
        userId: user.id,
        error: error.message,
      })
    })

    return response.redirect().toRoute('profile.show')
  }
}
