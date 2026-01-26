import User from '#auth/models/user'
import Role from '#core/models/role'
import Permission from '#core/models/permission'
import { DateTime } from 'luxon'

export class UserFactory {
  static async create(override: Partial<User> = {}): Promise<User> {
    const role = await RoleFactory.create({ slug: 'user' })
    return User.create({
      email: override.email || `user${Date.now()}@example.com`,
      password: override.password || 'password123',
      fullName: override.fullName || 'Test User',
      emailVerifiedAt:
        override.emailVerifiedAt !== undefined ? override.emailVerifiedAt : DateTime.now(),
      roleId: override.roleId || role.id,
      locale: override.locale || 'en',
      ...override,
    })
  }

  static async createUnverified(override: Partial<User> = {}): Promise<User> {
    return this.create({
      ...override,
      emailVerifiedAt: null,
    })
  }

  static async createAdmin(override: Partial<User> = {}): Promise<User> {
    const adminRole = await RoleFactory.createAdmin()
    return this.create({
      ...override,
      roleId: adminRole.id,
    })
  }
}

export class RoleFactory {
  static async create(override: Partial<Role> = {}): Promise<Role> {
    if (override.slug) {
      const existing = await Role.findBy('slug', override.slug)
      if (existing) return existing
    }

    return Role.create({
      name: override.name || `Role ${Date.now()}`,
      slug: override.slug || `role-${Date.now()}`,
      description: override.description || 'Test role',
      isSystem: override.isSystem || false,
      ...override,
    })
  }

  static async createAdmin(): Promise<Role> {
    const existing = await Role.findBy('slug', 'admin')
    if (existing) return existing

    return Role.create({
      name: 'Admin',
      slug: 'admin',
      description: 'Administrator role',
      isSystem: true,
    })
  }

  static async createWithPermissions(permissionSlugs: string[]): Promise<Role> {
    const role = await this.create()
    const permissions = await Permission.query().whereIn('slug', permissionSlugs)
    await role.related('permissions').attach(permissions.map((p) => p.id))
    return role
  }
}

export class PermissionFactory {
  static async create(override: Partial<Permission> = {}): Promise<Permission> {
    if (override.slug) {
      const existing = await Permission.findBy('slug', override.slug)
      if (existing) return existing
    }

    return Permission.create({
      name: override.name || `Permission ${Date.now()}`,
      slug: override.slug || `permission-${Date.now()}`,
      category: override.category || 'test',
      description: override.description || 'Test permission',
      isSystem: override.isSystem || false,
      ...override,
    })
  }

  static async createMany(count: number, category: string = 'test'): Promise<Permission[]> {
    const permissions: Permission[] = []
    for (let i = 0; i < count; i++) {
      permissions.push(
        await this.create({
          name: `Permission ${i}`,
          slug: `permission-${i}-${Date.now()}`,
          category,
        })
      )
    }
    return permissions
  }
}

import UserPreference from '#core/models/user_preference'

export class UserPreferenceFactory {
  static async create(override: Partial<UserPreference> = {}): Promise<UserPreference> {
    const user = override.userId ? { id: override.userId } : await UserFactory.create()
    return UserPreference.create({
      userId: user.id,
      preferences: override.preferences || {},
      ...override,
    })
  }
}

import Notification from '#notification/models/notification'

export class NotificationFactory {
  static async create(override: Partial<Notification> = {}): Promise<Notification> {
    const user = override.userId ? { id: override.userId } : await UserFactory.create()
    return Notification.create({
      userId: user.id,
      type: override.type || 'test_notification',
      title: override.title || 'Test Title',
      message: override.message || 'Test Message',
      data: override.data || null,
      ...override,
    })
  }
}

export class AuthHelper {
  static async loginAs(user: User): Promise<string> {
    // Return a mock session or token
    return `user-${user.id}-session`
  }

  static async logout(): Promise<void> {
    // Clear session
  }
}
