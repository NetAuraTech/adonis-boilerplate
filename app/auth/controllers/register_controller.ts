import type { HttpContext } from '@adonisjs/core/http'
import User from '#auth/models/user'
import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'
import { getEnabledProviders } from '#auth/helpers/oauth'

export default class RegisterController {
  static validator = vine.compile(
    vine.object({
      email: vine.string().email().unique(unique('users', 'email')),
      password: vine.string().minLength(8).confirmed(),
    })
  )
  render({ inertia }: HttpContext) {
    return inertia.render('auth/register', {
      providers: getEnabledProviders(),
    })
  }

  async execute({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(RegisterController.validator)

    const user = await User.create(payload)
    await auth.use('web').login(user)

    return response.redirect().toRoute('landing')
  }
}
