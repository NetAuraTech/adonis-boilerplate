import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#notification/services/notification_service'
import ErrorHandlerService from '#core/services/error_handler_service'

/**
 * Controller for deleting a notification
 * DELETE /api/notifications/:id
 */
@inject()
export default class NotificationDeleteController {
  constructor(
    protected notificationService: NotificationService,
    protected errorHandler: ErrorHandlerService
  ) {}

  async execute(ctx: HttpContext) {
    const { auth, params, response } = ctx

    try {
      const user = auth.getUserOrFail()
      const deleted = await this.notificationService.delete(Number(params.id), user.id)

      if (!deleted) {
        return response.notFound({ message: 'Notification not found' })
      }

      return response.noContent()
    } catch (error) {
      return this.errorHandler.handleApi(ctx, error)
    }
  }
}
