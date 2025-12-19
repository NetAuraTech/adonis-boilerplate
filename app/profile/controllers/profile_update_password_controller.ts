import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'

export default class ProfileUpdatePasswordController {
  static validator = vine.compile(
    vine.object({
      current_password: vine.string(),
      password: vine.string().minLength(8).confirmed(),
    })
  )

  async execute({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(ProfileUpdatePasswordController.validator)

    const isPasswordValid = await hash.verify(user.password, payload.current_password)

    if (!isPasswordValid) {
      session.flashExcept(['current_password', 'password', 'password_confirmation'])
      session.flashErrors({ current_password: 'The current password is incorrect.' })
      return response.redirect().back()
    }

    user.password = payload.password
    await user.save()

    session.flash('success', 'Your password has been updated successfully.')

    return response.redirect().toRoute('profile.show')
  }
}
