/**
 * Build pagination URL with filters
 */
export function buildPaginationUrl(
  baseUrl: string,
  page: number,
  filters: Record<string, string | number>
): string {
  const params = new URLSearchParams()
  params.set('page', page.toString())

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.set(key, value.toString())
    }
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * Extract current filters from props
 */
export function getCurrentFilters(filters: Record<string, any>): Record<string, string> {
  const cleanFilters: Record<string, string> = {}

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      cleanFilters[key] = value.toString()
    }
  })

  return cleanFilters
}
