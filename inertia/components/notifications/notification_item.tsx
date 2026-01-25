import { Notification } from '~/types/notification'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/elements/button'

interface NotificationItemProps {
  notification: Notification
  onClick: (id: number) => void
  onDelete: (id: number) => void
}

export function NotificationItem(props: NotificationItemProps) {
  const { notification, onClick, onDelete } = props

  const { t, i18n } = useTranslation('notifications')

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-4 h-4 clr-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-4 h-4 clr-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4 clr-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4 clr-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 clr-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return t('time.just_now')
    if (diffInMinutes < 60) return t('time.minutes_ago', { count: diffInMinutes })

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return t('time.hours_ago', { count: diffInHours })

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return t('time.days_ago', { count: diffInDays })

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return t('time.weeks_ago', { count: diffInWeeks })

    return i18n.format(notifDate, 'short', i18n.language)
  }

  const handleClick = () => {
    onClick(notification.id)
  }

  const handleDelete = () => {
    onDelete(notification.id)
  }

  return (
    <div
      className={`padding-4 border-0 border-bottom-1 border-solid border-neutral-200 hover:bg-neutral-050 transition:bg-300 cursor-pointer ${
        !notification.readAt ? 'bg-primary-100' : ''
      }`}
      onClick={handleClick}
      aria-label={!notification.readAt ?t('mark_read') : undefined}
      title={!notification.readAt ? t('mark_read') : undefined}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 margin-block-start-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 grid gap-1">
          <p className="fs-400 fw-semi-bold clr-neutral-900">{notification.title}</p>
          <p className="fs-300 clr-neutral-700 line-clamp-2">{notification.message}</p>
          <p className="fs-200 clr-neutral-500">{formatTimeAgo(notification.createdAt)}</p>
        </div>
        <div className="flex-shrink-0 flex flex-column gap-2 align-items-end">
          <Button
            onClick={handleDelete}
            variant="icon"
            padding="padding-0"
            aria-label={t('delete')}
            title={t('delete')}
          >
            <svg
              className="w-3 h-3 clr-neutral-600 hover:clr-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
