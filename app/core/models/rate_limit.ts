import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RateLimit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare hits: number

  @column.dateTime()
  declare resetAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Clean expired rate limits
   */
  static async cleanExpired(): Promise<number> {
    const result = await this.query().where('reset_at', '<', DateTime.now().toSQL()).delete()
    return result[0] || 0
  }
}
