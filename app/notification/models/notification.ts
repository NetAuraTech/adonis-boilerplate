import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#auth/models/user'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: string

  @column()
  declare title: string

  @column()
  declare message: string

  @column({
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare data: Record<string, any> | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Check if notification is read
   */
  get isRead(): boolean {
    return this.readAt !== null
  }

  /**
   * Mark notification as read
   */
  async markAsRead(): Promise<void> {
    if (!this.isRead) {
      this.readAt = DateTime.now()
      await this.save()
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(): Promise<void> {
    if (this.isRead) {
      this.readAt = null
      await this.save()
    }
  }

  /**
   * Query scope to filter unread notifications
   */
  static unread = scope((query) => {
    query.whereNull('read_at')
  })

  /**
   * Query scope to filter read notifications
   */
  static read = scope((query) => {
    query.whereNotNull('read_at')
  })

  /**
   * Query scope to filter by notification type
   */
  static byType = scope((query, type: string) => {
    query.where('type', type)
  })

  /**
   * Query scope to filter by user
   */
  static byUser = scope((query, userId: number) => {
    query.where('user_id', userId)
  })
}
