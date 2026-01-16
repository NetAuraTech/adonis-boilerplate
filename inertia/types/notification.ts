import { PaginationMeta } from '~/types/pagination'

export interface Notification {
  id: number
  userId: number
  type: string
  title: string
  message: string
  data: Record<string, any> | null
  readAt: string | null
  createdAt: string
}

export interface NotificationPaginatedResponse {
  data: Notification[]
  meta: PaginationMeta
}

export interface UnreadCountResponse {
  count: number
}
