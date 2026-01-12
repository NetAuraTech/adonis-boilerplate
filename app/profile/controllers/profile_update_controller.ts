import type { HttpContext } from '@adonisjs/core/http'
import { regenerateCsrfToken } from '#core/helpers/csrf'
import { inject } from '@adonisjs/core'
import EmailChangeService from '#auth/services/email_change_service'
import ProfileService from '#profile/services/profile_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import ProfileValidators from '#profile/validators/profile_validators'

@inject()
export default class ProfileUpdateController {
  constructor(
    protected emailChangeService: EmailChangeService,
    protected profileService: ProfileService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    try {
      const user = auth.getUserOrFail()

      const payload = await request.validateUsing(ProfileValidators.updateProfile(user.id))

      const { emailChanged, localeChanged } = await this.profileService.update(user, payload, i18n)

      if (localeChanged) {
        regenerateCsrfToken(ctx)
      }

      if (emailChanged) {
        await user.refresh()

        session.flash(
          'info',
          i18n.t('profile.update.email_change_initiated', {
            email: payload.email,
          })
        )
      }

      session.flash('success', i18n.t('profile.update.success'))

      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
