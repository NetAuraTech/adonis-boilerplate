import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'

export default class ProfileDeleteController {
  static validator = vine.compile(
    vine.object({
      password: vine.string(),
    })
  )

  async execute({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(ProfileDeleteController.validator)

    const isPasswordValid = await hash.verify(user.password!, payload.password)

    if (!isPasswordValid) {
      session.flashExcept(['password'])
      session.flashErrors({ password: 'The password is incorrect.' })
      return response.redirect().back()
    }

    await auth.use('web').logout()

    await user.delete()

    session.flash('success', 'Your account has been deleted successfully.')

    return response.redirect().toRoute('landing')
  }
}
