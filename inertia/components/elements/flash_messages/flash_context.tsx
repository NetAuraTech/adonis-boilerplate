import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Transmit } from '@adonisjs/transmit-client'

export type FlashType = 'success' | 'error' | 'warning' | 'info'

export interface FlashMessage {
  id: string
  type: FlashType
  message: string
  duration?: number
}

interface FlashContextValue {
  messages: FlashMessage[]
  addFlash: (type: FlashType, message: string, duration?: number) => void
  removeFlash: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const FlashContext = createContext<FlashContextValue | undefined>(undefined)

interface FlashProviderProps {
  children: ReactNode
}

export function FlashProvider({ children }: FlashProviderProps) {
  const [messages, setMessages] = useState<FlashMessage[]>([])
  const { currentUser } = usePage().props as any

  const addFlash = useCallback((type: FlashType, message: string, duration = 5000) => {
    const id = `${Date.now()}-${Math.random()}`
    setMessages((prev) => [...prev, { id, type, message, duration }])
  }, [])

  const removeFlash = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => {
      addFlash('success', message, duration)
    },
    [addFlash]
  )

  const error = useCallback(
    (message: string, duration?: number) => {
      addFlash('error', message, duration)
    },
    [addFlash]
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      addFlash('warning', message, duration)
    },
    [addFlash]
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      addFlash('info', message, duration)
    },
    [addFlash]
  )

  // Setup SSE for server-side flash messages
  useEffect(() => {
    if (!currentUser?.id) return

    let transmit: Transmit | null = null
    if (typeof window !== 'undefined') {
      transmit = new Transmit({
        baseUrl: window.location.origin,
      })
    }

    const subscription = transmit?.subscription(`user:${currentUser.id}:flash`)
    subscription?.create()

    subscription?.onMessage((data: any) => {
      if (data.type && data.message) {
        addFlash(data.type, data.message, data.duration)
      }
    })

    return () => {
      subscription?.delete()
    }
  }, [currentUser?.id, addFlash])

  return (
    <FlashContext.Provider value={{ messages, addFlash, removeFlash, success, error, warning, info }}>
      {children}
    </FlashContext.Provider>
  )
}

export function useFlash() {
  const context = useContext(FlashContext)
  if (!context) {
    throw new Error('useFlash must be used within FlashProvider')
  }
  return context
}
