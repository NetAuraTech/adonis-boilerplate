import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'

export default class ProfileUpdateController {
  async execute({ auth, request, response, session, i18n }: HttpContext) {
    const user = auth.getUserOrFail()

    const validator = vine.compile(
      vine.object({
        fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
        email: vine
          .string()
          .email()
          .unique(unique('users', 'email', { exceptId: user.id })),
        locale: vine.enum(['en', 'fr']),
      })
    )

    const payload = await request.validateUsing(validator)

    await user.merge(payload).save()

    session.flash('success', i18n.t('profile.update.success'))

    return response.redirect().toRoute('profile.show')
  }
}
