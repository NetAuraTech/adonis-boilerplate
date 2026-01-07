import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

/**
 * Interface for basic pagination filters
 */
export interface PaginationFilters {
  page?: number
  perPage?: number
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 15,
} as const

/**
 * Validation scheme for pagination
 */
export const paginationSchema = vine.object({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
})

/**
 * Extracts and validates the pagination parameters of the query
 */
export async function extractPagination(
  request: HttpContext['request'],
  defaults: { page?: number; perPage?: number } = DEFAULT_PAGINATION
): Promise<PaginationFilters> {
  const validator = vine.compile(paginationSchema)

  const validated = await validator.validate({
    page: request.input('page'),
    perPage: request.input('perPage'),
  })

  return {
    page: validated.page ?? defaults.page ?? DEFAULT_PAGINATION.page,
    perPage: validated.perPage ?? defaults.perPage ?? DEFAULT_PAGINATION.perPage,
  }
}

/**
 * Extracts pagination parameters without validation
 */
export function getPaginationParams(
  request: HttpContext['request'],
  defaults: { page?: number; perPage?: number } = DEFAULT_PAGINATION
): PaginationFilters {
  const page = Number(request.input('page')) || defaults.page || DEFAULT_PAGINATION.page
  const perPage = Number(request.input('perPage')) || defaults.perPage || DEFAULT_PAGINATION.perPage

  return {
    page: Math.max(1, page),
    perPage: Math.min(100, Math.max(1, perPage)),
  }
}
