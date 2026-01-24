import { inject } from '@adonisjs/core'
import Notification from '#notification/models/notification'
import UserPreference from '#core/models/user_preference'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { BaseMail } from '@adonisjs/mail'
import mail from '@adonisjs/mail/services/main'
import LogService, { LogCategory } from '#core/services/log_service'

export interface CreateNotificationData {
  userId: number
  type: string
  title: string
  message: string
  data?: Record<string, any>
}

export interface GetNotificationsOptions {
  page?: number
  limit?: number
  unreadOnly?: boolean
  type?: string
}

@inject()
export default class NotificationService {
  constructor(protected logService: LogService) {}

  async notify(data: CreateNotificationData | BaseMail) {
    if (data instanceof BaseMail) {
      await mail.send(data)
    } else {
      await this.create(data)
    }
  }

  /**
   * Create a new notification
   * Checks user preferences before creating in-app notification
   * Triggers SSE event if notification is created
   *
   * @param data - Notification data
   * @returns Created notification or null if user disabled this type
   */
  async create(data: CreateNotificationData): Promise<Notification | null> {
    const userPrefs = await UserPreference.query().where('user_id', data.userId).first()

    const inAppEnabled = userPrefs?.get(`notifications.inApp.${data.type}`, true)

    if (!inAppEnabled) {
      this.logService.debug({
        message: 'In-app notification skipped due to user preferences',
        category: LogCategory.BUSINESS,
        context: {
          userId: data.userId,
        },
        metadata: {
          type: data.type,
        },
      })
      return null
    }

    const notification = await Notification.create(data)

    this.logService.info({
      message: 'Notification created',
      category: LogCategory.BUSINESS,
      context: {
        userId: data.userId,
      },
      metadata: {
        notificationId: notification.id,
        type: data.type,
      },
    })

    // Broadcast via SSE
    await this.broadcastNotification(notification)

    return notification
  }

  /**
   * Get user notifications with pagination and filters
   *
   * @param userId - User ID
   * @param options - Query options (pagination, filters)
   * @returns Paginated notifications
   */
  async getUserNotifications(
    userId: number,
    options: GetNotificationsOptions = {}
  ): Promise<ModelPaginatorContract<Notification>> {
    const { page = 1, limit = 20, unreadOnly = false, type } = options

    const query = Notification.query().where('user_id', userId).orderBy('created_at', 'desc')

    if (unreadOnly) {
      query.apply((scopes) => scopes.unread())
    }

    if (type) {
      query.apply((scopes) => scopes.byType(type))
    }

    return query.paginate(page, limit)
  }

  /**
   * Get unread notification count for a user
   *
   * @param userId - User ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: number): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .apply((scopes) => scopes.unread())
      .count('* as total')
      .first()

    return Number(result?.$extras.total || 0)
  }

  /**
   * Mark a notification as read
   *
   * @param notificationId - Notification ID
   * @param userId - User ID (for security check)
   * @returns Updated notification or null if not found
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification | null> {
    const notification = await Notification.query()
      .where('id', notificationId)
      .where('user_id', userId)
      .first()

    if (!notification) {
      return null
    }

    await notification.markAsRead()

    this.logService.debug({
      message: 'Notification marked as read',
      category: LogCategory.BUSINESS,
      context: {
        userId,
      },
      metadata: {
        notificationId,
      },
    })

    return notification
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - User ID
   * @returns Number of notifications updated
   */
  async markAllAsRead(userId: number): Promise<number> {
    const updated = await Notification.query()
      .where('user_id', userId)
      .whereNull('read_at')
      .update({ read_at: DateTime.now() })

    const count = Array.isArray(updated) ? updated.length : updated

    this.logService.info({
      message: 'All notifications marked as read',
      category: LogCategory.BUSINESS,
      context: {
        userId,
      },
      metadata: {
        count,
      },
    })

    return count
  }

  /**
   * Delete a notification
   *
   * @param notificationId - Notification ID
   * @param userId - User ID (for security check)
   * @returns True if deleted, false if not found
   */
  async delete(notificationId: number, userId: number): Promise<boolean> {
    const notification = await Notification.query()
      .where('id', notificationId)
      .where('user_id', userId)
      .first()

    if (!notification) {
      return false
    }

    await notification.delete()

    this.logService.debug({
      message: 'Notification deleted',
      category: LogCategory.BUSINESS,
      context: {
        userId,
      },
      metadata: {
        notificationId,
      },
    })

    return true
  }

  /**
   * Delete all notifications for a user
   * Used when cleaning user account
   *
   * @param userId - User ID
   * @returns Number of notifications deleted
   */
  async deleteAllForUser(userId: number): Promise<number> {
    const deleted = await Notification.query().where('user_id', userId).delete()

    const count = Array.isArray(deleted) ? deleted.length : deleted

    this.logService.info({
      message: 'All notifications deleted for user',
      category: LogCategory.BUSINESS,
      context: {
        userId,
      },
      metadata: {
        count,
      },
    })

    return count
  }

  /**
   * Check if user should receive email for this notification type
   *
   * @param userId - User ID
   * @param notificationType - Notification type
   * @returns True if user accepts email for this type
   */
  async shouldSendEmail(userId: number, notificationType: string): Promise<boolean> {
    const userPrefs = await UserPreference.query().where('user_id', userId).first()

    return userPrefs?.get(`notifications.email.${notificationType}`, true) ?? true
  }

  /**
   * Broadcast notification via SSE (Server-Sent Events)
   * Private method used after notification creation
   *
   * @param notification - The notification to broadcast
   */
  private async broadcastNotification(notification: Notification): Promise<void> {
    try {
      transmit.broadcast(`user:${notification.userId}:notifications`, {
        type: 'notification.created',
        notification: notification.serialize(),
      })

      this.logService.debug({
        message: 'Notification broadcasted via SSE',
        category: LogCategory.SYSTEM,
        context: {
          userId: notification.userId,
        },
        metadata: {
          notificationId: notification.id,
        },
      })
    } catch (error) {
      this.logService.error({
        message: 'Failed to broadcast notification via SSE',
        category: LogCategory.SYSTEM,
        error,
        context: {
          userId: notification.userId,
        },
        metadata: {
          notificationId: notification.id,
        },
      })

      throw error
    }
  }
}
