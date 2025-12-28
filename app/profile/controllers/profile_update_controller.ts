import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { unique } from '#core/helpers/validator'
import { regenerateCsrfToken } from '#core/helpers/csrf'
import { inject } from '@adonisjs/core'
import EmailChangeService from '#auth/services/email_change_service'

@inject()
export default class ProfileUpdateController {
  constructor(protected emailChangeService: EmailChangeService) {}

  async execute({ auth, request, response, session, i18n }: HttpContext) {
    const user = auth.user!

    if (!user.isEmailVerified) {
      session.flash('error', i18n.t('auth.verify_email.required'))
      return response.redirect().back()
    }

    const validator = vine.compile(
      vine.object({
        fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
        email: vine
          .string()
          .trim()
          .toLowerCase()
          .email()
          .unique(unique('users', 'email', { exceptId: user.id })),
        locale: vine.enum(['en', 'fr']),
      })
    )

    const payload = await request.validateUsing(validator)

    const emailChanged = user.email !== payload.email
    const localeChanged = user.locale !== payload.locale

    if (emailChanged) {
      try {
        await this.emailChangeService.initiateEmailChange(user, payload.email, i18n)

        await user.refresh()

        session.flash(
          'info',
          i18n.t('profile.update.email_change_initiated', {
            email: payload.email,
          })
        )
      } catch (error) {
        console.log(error)
        session.flash('error', i18n.t('profile.update.email_change_failed'))
        return response.redirect().back()
      }
    }

    user.merge({
      fullName: payload.fullName,
      locale: payload.locale,
    })

    await user.save()

    if (localeChanged) {
      regenerateCsrfToken({ request, response, session } as HttpContext)
    }

    if (emailChanged) {
      return response.redirect().back()
    }

    session.flash('success', i18n.t('profile.update.success'))

    return response.redirect().toRoute('profile.show')
  }
}
