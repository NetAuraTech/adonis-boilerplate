import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Permission from '#core/models/permission'
import User from '#auth/models/user'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare isSystem: boolean

  @manyToMany(() => Permission, {
    pivotTable: 'role_permission',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  })
  declare permissions: ManyToMany<typeof Permission>

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /**
   * Check if role has a specific permission
   */
  async hasPermission(permissionSlug: string): Promise<boolean> {
    await (this as Role).load('permissions')
    return this.permissions.some((p) => p.slug === permissionSlug)
  }

  /**
   * Check if role is admin
   */
  get isAdmin(): boolean {
    return this.slug === 'admin'
  }

  /**
   * Check if role can be deleted
   */
  get canBeDeleted(): boolean {
    return !this.isSystem
  }

  /**
   * Check if role can be modified
   */
  get canBeModified(): boolean {
    return !this.isSystem
  }

  /**
   * Assign permission to role
   */
  async assignPermission(permissionId: number): Promise<void> {
    await (this as Role).related('permissions').attach({ [permissionId]: {} })
  }

  /**
   * Remove permission from role
   */
  async removePermission(permissionId: number): Promise<void> {
    await (this as Role).related('permissions').detach([permissionId])
  }

  /**
   * Sync permissions (replace all)
   */
  async syncPermissions(permissionIds: number[]): Promise<void> {
    const pivotData: Record<number, Record<string, never>> = {}
    permissionIds.forEach((id) => {
      pivotData[id] = {}
    })

    await (this as Role).related('permissions').sync(pivotData, true)
  }
}
