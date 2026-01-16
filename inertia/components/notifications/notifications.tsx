import { useRef, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import { useNotifications } from '~/hooks/use_notifications'
import { useAuth } from '~/hooks/use_auth'
import { NotificationItem } from '~/components/notifications/notification_item'
import { Heading } from '~/components/elements/heading'
import { Button } from '~/components/elements/button'
import { useTranslation } from 'react-i18next'

export function Notifications() {
  const { user } = useAuth()
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { t } = useTranslation('notifications')

  const {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setIsOpen,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  } = useNotifications(user?.id)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  if (!user) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex align-items-center fs-400 padding-block-3 padding-inline-6 justify-content-center fw-bold transition:bg-300 transition:clr-300 cursor-pointer border-0 border-radius-2 bg-transparent clr-neutral-700 hover:clr-accent-800 w-fit"
        aria-label={t('title')}
      >
        <svg
          className="w-size-6 h-size-6 clr-neutral-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex align-items-center justify-content-center w-3 h-3 fs-200 fw-bold bg-red-500 clr-neutral-000 border-radius-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 margin-block-start-2 w-size-18 bg-neutral-000 border-radius-2 box-shadow-1 border-1 border-solid border-neutral-300 animation:slide-up"
        >
          <div className="padding-4 border-0 border-bottom-1 border-solid border-neutral-200 flex flex-wrap justify-content-space-between align-items-center">
            <Heading level={3}>{ t('title') }</Heading>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="transparent"
                padding="padding-0"
                fitContent
              >
                {
                  t('mark_all_read')
                }
              </Button>
            )}
          </div>
          <div
            className="overflow-auto h-size-max-20"
          >
            {isLoading ? (
              <div className="padding-8 text-center">
                <svg
                  className="margin-inline-auto w-size-8 h-size-8 clr-primary-500 animation:spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="grid gap-2 padding-8 justify-content-center">
                <svg
                  className="clr-neutral-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="fs-400 clr-neutral-600">
                  {
                    t('no_notifications')
                  }
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="padding-3 border-0 border-top-1 border-solid border-neutral-200 text-center">
              <Link
                href="/notifications"
                className="fs-300 clr-primary-600 hover:clr-primary-700 transition:clr-300 fw-semi-bold"
                onClick={() => setIsOpen(false)}
              >
                {
                  t('view_all')
                }
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
