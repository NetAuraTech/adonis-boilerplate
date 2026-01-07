import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#core/models/role'
import Permission from '#core/models/permission'

export default class extends BaseSeeder {
  async run() {
    // ========================================
    // 1. CREATE PERMISSIONS
    // ========================================

    const permissions = [
      // Admin Category
      {
        name: 'Access Admin Dashboard',
        slug: 'admin.access',
        category: 'admin',
        description: 'Access to the admin dashboard',
        isSystem: true, // SYSTEM PERMISSION - Cannot be deleted
      },

      // Users Category
      {
        name: 'View Users',
        slug: 'users.view',
        category: 'users',
        description: 'View users list and details',
        isSystem: true,
      },
      {
        name: 'Create Users',
        slug: 'users.create',
        category: 'users',
        description: 'Create new users',
        isSystem: true,
      },
      {
        name: 'Update Users',
        slug: 'users.update',
        category: 'users',
        description: 'Update user information',
        isSystem: true,
      },
      {
        name: 'Delete Users',
        slug: 'users.delete',
        category: 'users',
        description: 'Delete users',
        isSystem: true,
      },
      {
        name: 'Manage User Roles',
        slug: 'users.manage_roles',
        category: 'users',
        description: 'Assign and remove roles from users',
        isSystem: true,
      },

      // Roles Category
      {
        name: 'View Roles',
        slug: 'roles.view',
        category: 'roles',
        description: 'View roles list and details',
        isSystem: true,
      },
      {
        name: 'Create Roles',
        slug: 'roles.create',
        category: 'roles',
        description: 'Create new roles',
        isSystem: true,
      },
      {
        name: 'Update Roles',
        slug: 'roles.update',
        category: 'roles',
        description: 'Update role information',
        isSystem: true,
      },
      {
        name: 'Delete Roles',
        slug: 'roles.delete',
        category: 'roles',
        description: 'Delete roles',
        isSystem: true,
      },
      {
        name: 'Manage Role Permissions',
        slug: 'roles.manage_permissions',
        category: 'roles',
        description: 'Assign and remove permissions from roles',
        isSystem: true,
      },

      // Permissions Category
      {
        name: 'View Permissions',
        slug: 'permissions.view',
        category: 'permissions',
        description: 'View permissions list and details',
        isSystem: true,
      },
      {
        name: 'Create Permissions',
        slug: 'permissions.create',
        category: 'permissions',
        description: 'Create new permissions',
        isSystem: true,
      },
      {
        name: 'Update Permissions',
        slug: 'permissions.update',
        category: 'permissions',
        description: 'Update permission information',
        isSystem: true,
      },
      {
        name: 'Delete Permissions',
        slug: 'permissions.delete',
        category: 'permissions',
        description: 'Delete permissions',
        isSystem: true,
      },
    ]

    const createdPermissions = await Promise.all(
      permissions.map((permission) =>
        Permission.updateOrCreate({ slug: permission.slug }, permission)
      )
    )

    // ========================================
    // 2. CREATE ROLES
    // ========================================

    const adminRole = await Role.updateOrCreate(
      { slug: 'admin' },
      {
        name: 'Administrator',
        slug: 'admin',
        description: 'Full system access with all permissions',
        isSystem: true, // SYSTEM ROLE - Cannot be deleted or modified
      }
    )

    const userRole = await Role.updateOrCreate(
      { slug: 'user' },
      {
        name: 'User',
        slug: 'user',
        description: 'Standard user with limited permissions',
        isSystem: true, // SYSTEM ROLE - Cannot be deleted
      }
    )

    // ========================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // ========================================

    // Admin gets ALL permissions
    const allPermissionIds = createdPermissions.map((p) => p.id)
    const adminPivotData: Record<number, Record<string, never>> = {}
    allPermissionIds.forEach((id) => {
      adminPivotData[id] = {}
    })

    await adminRole.related('permissions').sync(adminPivotData, true)

    // User gets NO permissions by default (can be customized later)
    await userRole.related('permissions').sync({}, true)

    console.log('✅ Roles and permissions seeded successfully')
    console.log(`   - Created ${createdPermissions.length} permissions`)
    console.log(`   - Created 2 roles (Admin, User)`)
    console.log(`   - Admin role has all ${allPermissionIds.length} permissions`)
  }
}
