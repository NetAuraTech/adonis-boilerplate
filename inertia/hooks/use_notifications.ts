import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Transmit } from '@adonisjs/transmit-client'
import { useApiErrorHandler } from '~/hooks/use_api_error_handler'
import type {
  Notification,
  NotificationPaginatedResponse,
  UnreadCountResponse,
} from '~/types/notification'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  refreshNotifications: () => Promise<void>
}

export function useNotifications(userId?: number): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const { handleError } = useApiErrorHandler()

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      const { data } = await axios.get<NotificationPaginatedResponse>('/api/notifications', {
        params: { limit: 10 },
      })
      setNotifications(data.data || [])
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, handleError])

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return

    try {
      const { data } = await axios.get<UnreadCountResponse>('/api/notifications/unread-count')
      setUnreadCount(data.count || 0)
    } catch (error) {
      handleError(error)
    }
  }, [userId, handleError])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await axios.patch(`/api/notifications/${id}/read`)

        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        handleError(error)
      }
    },
    [handleError]
  )

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read')

      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      handleError(error)
    }
  }, [handleError])

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(
    async (id: number) => {
      try {
        await axios.delete(`/api/notifications/${id}`)

        const wasUnread = notifications.find((n) => n.id === id)?.readAt === null
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (error) {
        handleError(error)
      }
    },
    [notifications, handleError]
  )

  /**
   * Refresh notifications
   */
  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  /**
   * Setup SSE connection for real-time notifications
   */
  useEffect(() => {
    if (!userId) return

    let transmit: Transmit | null = null
    if (typeof window !== 'undefined') {
      transmit = new Transmit({
        baseUrl: window.location.origin,
      })
    }

    fetchNotifications()
    fetchUnreadCount()

    const subscription = transmit?.subscription(`user:${userId}:notifications`)

    subscription?.create()

    subscription?.onMessage((data: any) => {
      if (data.type === 'notification.created') {
        setNotifications((prev) => [data.notification, ...prev.slice(0, 9)])
        setUnreadCount((prev) => prev + 1)
      }
    })

    return () => {
      subscription?.delete()
    }
  }, [userId, fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  }
}
