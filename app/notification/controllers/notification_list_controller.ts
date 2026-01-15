import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#notification/services/notification_service'
import ErrorHandlerService from '#core/services/error_handler_service'
import NotificationValidators from '#notification/validators/notification_validators'

/**
 * Controller for listing user notifications
 * GET /notifications
 */
@inject()
export default class NotificationListController {
  constructor(
    protected notificationService: NotificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, request } = ctx

    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(NotificationValidators.list())

      return await this.notificationService.getUserNotifications(user.id, {
        page: payload.page,
        limit: payload.limit,
        unreadOnly: payload.unread_only,
        type: payload.type,
      })
    } catch (error) {
      return this.errorHandler.handleApi(ctx, error)
    }
  }
}
