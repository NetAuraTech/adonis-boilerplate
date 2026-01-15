import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#notification/services/notification_service'
import ErrorHandlerService from '#core/services/error_handler_service'

/**
 * Controller for marking a notification as read
 * PATCH /api/notifications/:id/read
 */
@inject()
export default class NotificationMarkAsReadController {
  constructor(
    protected notificationService: NotificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, params, response } = ctx

    try {
      const user = auth.getUserOrFail()
      const notification = await this.notificationService.markAsRead(Number(params.id), user.id)

      if (!notification) {
        return response.notFound({ message: 'Notification not found' })
      }

      return notification
    } catch (error) {
      return this.errorHandler.handleApi(ctx, error)
    }
  }
}
