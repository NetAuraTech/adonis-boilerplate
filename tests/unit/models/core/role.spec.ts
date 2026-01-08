import { test } from '@japa/runner'
import { RoleFactory, PermissionFactory } from '#tests/helpers/factories'

test.group('Role Model', () => {
  test('hasPermission: should return true when role has permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({ slug: 'users.create' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])

    const hasPermission = await role.hasPermission('users.create')
    assert.isTrue(hasPermission)
  })

  test('hasPermission: should return false when role does not have permission', async ({
    assert,
  }) => {
    const role = await RoleFactory.create()

    const hasPermission = await role.hasPermission('users.delete')
    assert.isFalse(hasPermission)
  })

  test('isAdmin: should return true for admin slug', async ({ assert }) => {
    const adminRole = await RoleFactory.create({ slug: 'admin' })
    assert.isTrue(adminRole.isAdmin)
  })

  test('isAdmin: should return false for non-admin slug', async ({ assert }) => {
    const userRole = await RoleFactory.create({ slug: 'user' })
    assert.isFalse(userRole.isAdmin)
  })

  test('canBeDeleted: should return false for system roles', async ({ assert }) => {
    const systemRole = await RoleFactory.create({ isSystem: true })
    assert.isFalse(systemRole.canBeDeleted)
  })

  test('canBeDeleted: should return true for non-system roles', async ({ assert }) => {
    const customRole = await RoleFactory.create({ isSystem: false })
    assert.isTrue(customRole.canBeDeleted)
  })

  test('canBeModified: should return false for system roles', async ({ assert }) => {
    const systemRole = await RoleFactory.create({ isSystem: true })
    assert.isFalse(systemRole.canBeModified)
  })

  test('canBeModified: should return true for non-system roles', async ({ assert }) => {
    const customRole = await RoleFactory.create({ isSystem: false })
    assert.isTrue(customRole.canBeModified)
  })

  test('assignPermission: should add permission to role', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    const role = await RoleFactory.create()

    await role.assignPermission(permission.id)

    await role.load('permissions')
    assert.lengthOf(role.permissions, 1)
    assert.equal(role.permissions[0].id, permission.id)
  })

  test('removePermission: should remove permission from role', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])

    await role.removePermission(permission.id)

    await role.load('permissions')
    assert.lengthOf(role.permissions, 0)
  })

  test('syncPermissions: should replace all permissions', async ({ assert }) => {
    const permissions = await PermissionFactory.createMany(3, 'test')
    const role = await RoleFactory.create()

    // Initially assign first two permissions
    await role.related('permissions').attach([permissions[0].id, permissions[1].id])

    // Sync to only last permission
    await role.syncPermissions([permissions[2].id])

    await role.load('permissions')
    assert.lengthOf(role.permissions, 1)
    assert.equal(role.permissions[0].id, permissions[2].id)
  })

  test('syncPermissions: should handle empty array', async ({ assert }) => {
    const permissions = await PermissionFactory.createMany(2, 'test')
    const role = await RoleFactory.create()
    await role.related('permissions').attach(permissions.map((p) => p.id))

    await role.syncPermissions([])

    await role.load('permissions')
    assert.lengthOf(role.permissions, 0)
  })

  test('syncPermissions: should handle multiple permissions', async ({ assert }) => {
    const permissions = await PermissionFactory.createMany(5, 'test')
    const role = await RoleFactory.create()

    await role.syncPermissions(permissions.map((p) => p.id))

    await role.load('permissions')
    assert.lengthOf(role.permissions, 5)
  })

  test('should maintain relationship with users', async ({ assert }) => {
    const { UserFactory } = await import('#tests/helpers/factories')
    const role = await RoleFactory.create()
    const user = await UserFactory.create({ roleId: role.id })

    await role.load('users')
    assert.lengthOf(role.users, 1)
    assert.equal(role.users[0].id, user.id)
  })

  test('should maintain relationship with permissions', async ({ assert }) => {
    const permissions = await PermissionFactory.createMany(3, 'test')
    const role = await RoleFactory.create()
    await role.related('permissions').attach(permissions.map((p) => p.id))

    await role.load('permissions')
    assert.lengthOf(role.permissions, 3)
  })
})
