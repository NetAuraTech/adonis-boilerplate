import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#notification/services/notification_service'
import ErrorHandlerService from '#core/services/error_handler_service'

/**
 * Controller for getting unread notification count
 * GET /api/notifications/unread-count
 */
@inject()
export default class NotificationUnreadCountController {
  constructor(
    protected notificationService: NotificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth } = ctx

    try {
      const user = auth.getUserOrFail()
      const count = await this.notificationService.getUnreadCount(user.id)

      return { count }
    } catch (error) {
      return this.errorHandler.handleApi(ctx, error)
    }
  }
}
