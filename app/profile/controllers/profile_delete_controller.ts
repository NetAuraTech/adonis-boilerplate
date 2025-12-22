import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'

export default class ProfileDeleteController {
  static validator = vine.compile(
    vine.object({
      password: vine.string(),
    })
  )

  async execute({ auth, request, response, session, i18n }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(ProfileDeleteController.validator)

    const isPasswordValid = await hash.verify(user.password!, payload.password)

    if (!isPasswordValid) {
      session.flashExcept(['password'])
      session.flashErrors({ password: i18n.t('profile.delete.incorrect_password') })
      return response.redirect().back()
    }

    await auth.use('web').logout()

    await user.delete()

    session.flash('success', i18n.t('profile.delete.success'))

    return response.redirect().toRoute('landing')
  }
}
