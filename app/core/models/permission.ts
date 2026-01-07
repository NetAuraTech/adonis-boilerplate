import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#core/models/role'

export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare category: string

  @column()
  declare description: string | null

  @column()
  declare isSystem: boolean

  @manyToMany(() => Role, {
    pivotTable: 'role_permission',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  })
  declare roles: ManyToMany<typeof Role>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /**
   * Check if permission can be deleted
   */
  get canBeDeleted(): boolean {
    return !this.isSystem
  }

  /**
   * Check if permission can be modified
   */
  get canBeModified(): boolean {
    return !this.isSystem
  }
}
