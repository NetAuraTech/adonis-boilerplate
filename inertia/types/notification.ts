export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  data: Record<string, any> | null
  read_at: string | null
}
