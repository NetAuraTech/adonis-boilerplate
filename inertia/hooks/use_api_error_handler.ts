import { useCallback } from 'react'
import axios from 'axios'
import { ApiError } from '~/errors/api_error'
import { useFlash } from '~/components/elements/flash_messages/flash_context'

interface CustomErrorHandler {
  code?: string
  status?: number
  message?: string
  callback?: (error: ApiError) => void | Promise<void>
}

interface UseApiErrorHandlerReturn {
  /**
   * Handle an API error with optional custom handlers
   */
  handleError: (error: any, customHandlers?: CustomErrorHandler[]) => void

  /**
   * Wrap an async function with automatic error handling
   */
  withErrorHandling: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    customHandlers?: CustomErrorHandler[]
  ) => T
}

/**
 * Hook for handling API errors consistently across the app
 * Similar to backend ErrorHandlerService but for frontend
 */
export function useApiErrorHandler(): UseApiErrorHandlerReturn {
  const { addFlash } = useFlash()

  /**
   * Find matching custom handler for the error
   */
  const findMatchingHandler = useCallback(
    (apiError: ApiError, handlers: CustomErrorHandler[]): CustomErrorHandler | null => {
      for (const handler of handlers) {
        const isMatch =
          (handler.code && apiError.code === handler.code) ||
          (handler.status && apiError.status === handler.status) ||
          (handler.message && apiError.message === handler.message)

        if (isMatch) {
          return handler
        }
      }
      return null
    },
    []
  )

  /**
   * Handle an API error
   */
  const handleError = useCallback(
    (error: any, customHandlers: CustomErrorHandler[] = []) => {
      const apiError = axios.isAxiosError(error)
        ? ApiError.fromAxiosError(error)
        : new ApiError(error)

      const customHandler = findMatchingHandler(apiError, customHandlers)
      if (customHandler) {
        if (customHandler.callback) {
          customHandler.callback(apiError)
          return
        }

        const message = customHandler.message || apiError.message
        addFlash(apiError.getFlashType(), message)
        return
      }

      addFlash(apiError.getFlashType(), apiError.message)
    },
    [addFlash, findMatchingHandler]
  )

  /**
   * Wrap an async function with automatic error handling
   */
  const withErrorHandling = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      customHandlers: CustomErrorHandler[] = []
    ): T => {
      return (async (...args: any[]) => {
        try {
          return await fn(...args)
        } catch (error) {
          handleError(error, customHandlers)
          throw error
        }
      }) as T
    },
    [handleError]
  )

  return {
    handleError,
    withErrorHandling,
  }
}
