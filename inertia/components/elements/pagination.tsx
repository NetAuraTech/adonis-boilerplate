import { Link } from '@inertiajs/react'
import { buildPaginationUrl } from '~/helpers/pagination'

interface PaginationProps {
  baseUrl: string
  currentPage: number
  lastPage: number
  total: number
  perPage: number
  filters?: Record<string, string | number>
}

export function Pagination(props: PaginationProps) {
  const { baseUrl, currentPage, lastPage, total, perPage, filters = {} } = props

  if (lastPage <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, total)

  const generatePageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5

    if (lastPage <= showPages + 2) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(lastPage - 1, currentPage + 1)

      if (currentPage <= 3) {
        end = 4
      }

      if (currentPage >= lastPage - 2) {
        start = lastPage - 3
      }

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < lastPage - 1) {
        pages.push('...')
      }

      pages.push(lastPage)
    }

    return pages
  }

  return (
    <div className="flex flex-wrap gap-4 justify-content-space-between align-items-center padding-4 border-top-1 border-neutral-200">
      <div className="fs-300 clr-neutral-600">
        Showing {startItem} to {endItem} of {total} results
      </div>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildPaginationUrl(baseUrl, currentPage - 1, filters)}
            className="padding-2 padding-inline-3 bg-neutral-100 hover:bg-neutral-200 border-radius-1 fs-300"
          >
            Previous
          </Link>
        ) : (
          <span className="padding-2 padding-inline-3 bg-neutral-050 clr-neutral-400 border-radius-1 fs-300">
            Previous
          </span>
        )}
        <div className="flex gap-1">
          {generatePageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="padding-2 padding-inline-3 clr-neutral-500">
                  ...
                </span>
              )
            }

            return (
              <Link
                key={page}
                href={buildPaginationUrl(baseUrl, page as number, filters)}
                className={`padding-2 padding-inline-3 border-radius-1 fs-300 ${
                  page === currentPage
                    ? 'bg-primary-800 clr-neutral-000 fw-semi-bold'
                    : 'bg-neutral-100 hover:bg-neutral-200 clr-neutral-700'
                }`}
              >
                {page}
              </Link>
            )
          })}
        </div>
        {currentPage < lastPage ? (
          <Link
            href={buildPaginationUrl(baseUrl, currentPage + 1, filters)}
            className="padding-2 padding-inline-3 bg-neutral-100 hover:bg-neutral-200 border-radius-1 fs-300"
          >
            Next
          </Link>
        ) : (
          <span className="padding-2 padding-inline-3 bg-neutral-050 clr-neutral-400 border-radius-1 fs-300">
            Next
          </span>
        )}
      </div>
    </div>
  )
}
