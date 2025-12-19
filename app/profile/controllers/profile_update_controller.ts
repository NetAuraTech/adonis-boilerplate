import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'

export default class ProfileUpdateController {
  async execute({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const validator = vine.compile(
      vine.object({
        fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
        email: vine
          .string()
          .email()
          .unique(unique('users', 'email', { exceptId: user.id })),
      })
    )

    const payload = await request.validateUsing(validator)

    await user.merge(payload).save()

    session.flash('success', 'Your profile has been updated successfully.')

    return response.redirect().toRoute('profile.show')
  }
}
