import type { HttpContext } from '@adonisjs/core/http'
import ProfileService from '#profile/services/profile_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import { inject } from '@adonisjs/core'

@inject()
export default class ProfileCleanNotificationsController {
  constructor(
    protected profileService: ProfileService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { response, session, auth, i18n } = ctx

    try {
      const user = auth.getUserOrFail()
      await this.profileService.cleanNotification(user)

      session.flash('success', i18n.t('profile.notifications.cleared'))

      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
