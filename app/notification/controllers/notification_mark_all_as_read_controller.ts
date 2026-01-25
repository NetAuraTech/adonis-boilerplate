import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#notification/services/notification_service'
import ErrorHandlerService from '#core/services/error_handler_service'

/**
 * Controller for marking all notifications as read
 * PUT /api/notifications/mark-all-read
 */
@inject()
export default class NotificationMarkAllAsReadController {
  constructor(
    protected notificationService: NotificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth } = ctx

    try {
      const user = auth.getUserOrFail()
      const count = await this.notificationService.markAllAsRead(user.id)

      return { count }
    } catch (error) {
      return this.errorHandler.handleApi(ctx, error)
    }
  }
}
