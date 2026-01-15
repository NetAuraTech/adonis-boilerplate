import vine from '@vinejs/vine'

/**
 * Validators for notification-related endpoints
 */
export default class NotificationValidators {
  /**
   * Validator for listing notifications
   * Supports pagination and filtering
   */
  static list = () => {
    return vine.compile(
      vine.object({
        page: vine.number().min(1).optional(),
        limit: vine.number().min(1).max(100).optional(),
        unread_only: vine.boolean().optional(),
        type: vine.string().trim().optional(),
      })
    )
  }

  /**
   * Validator for marking notification as read
   * Validates notification ID parameter
   */
  static markAsRead = () => {
    return vine.compile(
      vine.object({
        id: vine.number().positive(),
      })
    )
  }

  /**
   * Validator for deleting a notification
   * Validates notification ID parameter
   */
  static delete = () => {
    return vine.compile(
      vine.object({
        id: vine.number().positive(),
      })
    )
  }
}
