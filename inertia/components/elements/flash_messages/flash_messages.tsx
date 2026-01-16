import { usePage } from '@inertiajs/react'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FlashMessage, useFlash } from '~/components/elements/flash_messages/flash_context'

interface FlashProps {
  success?: string
  error?: string
  warning?: string
  info?: string
}

interface MessageState extends FlashMessage {
  isExiting: boolean
}

export function FlashMessages() {
  const { t } = useTranslation('common')
  const { flash } = usePage<{ flash: FlashProps }>().props
  const { messages, removeFlash } = useFlash()
  const [displayMessages, setDisplayMessages] = useState<MessageState[]>([])

  const EXIT_SPEED = 450

  const handleClose = useCallback((id: string) => {
    setDisplayMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isExiting: true } : msg))
    )
    setTimeout(() => {
      removeFlash(id)
      setDisplayMessages((prev) => prev.filter((msg) => msg.id !== id))
    }, EXIT_SPEED)
  }, [removeFlash])

  useEffect(() => {
    const msg = flash?.success || flash?.error || flash?.warning || flash?.info
    if (!msg) return

    let type: 'success' | 'error' | 'warning' | 'info' = 'info'
    if (flash.success) type = 'success'
    else if (flash.error) type = 'error'
    else if (flash.warning) type = 'warning'
    else if (flash.info) type = 'info'

    const id = `session-${Date.now()}`
    const newMessage: MessageState = {
      id,
      type,
      message: msg,
      duration: 5000,
      isExiting: false,
    }

    setDisplayMessages((prev) => [...prev, newMessage])

    const timer = setTimeout(() => handleClose(id), 5000)
    return () => clearTimeout(timer)
  }, [flash, handleClose])

  useEffect(() => {
    messages.forEach((msg) => {
      const exists = displayMessages.some((m) => m.id === msg.id)
      if (!exists) {
        setDisplayMessages((prev) => [...prev, { ...msg, isExiting: false }])

        if (msg.duration && msg.duration > 0) {
          setTimeout(() => handleClose(msg.id), msg.duration)
        }
      }
    })
  }, [messages, displayMessages, handleClose])

  if (displayMessages.length === 0) return null

  const config = {
    success: {
      bg: 'bg-green-400',
      clr: 'clr-green-400',
      icon: <path d="M5 13l4 4L19 7" />,
    },
    error: {
      bg: 'bg-red-400',
      clr: 'clr-red-400',
      icon: <path d="M6 18L18 6M6 6l12 12" />,
    },
    warning: {
      bg: 'bg-orange-400',
      clr: 'clr-orange-400',
      icon: (
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      ),
    },
    info: {
      bg: 'bg-blue-300',
      clr: 'clr-blue-300',
      icon: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
  }

  return (
    <div className="toast-container">
      {displayMessages.map((msg) => {
        const current = config[msg.type]
        return (
          <div
            key={msg.id}
            className={`
              toast relative bg-neutral-100 clr-neutral-1000 padding-4 border-solid border-1 border-neutral-400 border-radius-2 box-shadow-3 margin-block-end-2
              ${msg.isExiting ? 'animation:toast-out' : 'animation:toast-in'}
            `}
          >
            <div className="flex-group align-items-center justify-content-space-between gap-6">
              <div className="flex-group align-items-center gap-3">
                <svg
                  className={`${current.clr} w-size-6 h-size-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {current.icon}
                </svg>
                <p className="fs-400 fw-medium">{msg.message}</p>
              </div>

              <button
                onClick={() => handleClose(msg.id)}
                className="clr-neutral-500 hover:clr-neutral-000 transition:clr-300 pointer-events-auto"
                aria-label={t('flash.close_label')}
              >
                <svg
                  className="w-size-5 h-size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {msg.duration && msg.duration > 0 && (
              <div
                className={`toast__progress ${current.bg}`}
                style={{ animationDuration: `${msg.duration}ms` }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
