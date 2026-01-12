import { test } from '@japa/runner'
import { PermissionFactory, RoleFactory } from '#tests/helpers/factories'
import Permission from '#core/models/permission'

test.group('Permission Model', () => {
  test('canBeDeleted: should return true for non-system permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: false })

    assert.isTrue(permission.canBeDeleted)
  })

  test('canBeDeleted: should return false for system permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: true })

    assert.isFalse(permission.canBeDeleted)
  })

  test('canBeModified: should return true for non-system permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: false })

    assert.isTrue(permission.canBeModified)
  })

  test('canBeModified: should return false for system permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: true })

    assert.isFalse(permission.canBeModified)
  })

  test('should have correct structure', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      name: 'Test Permission',
      slug: 'test.permission',
      category: 'test',
      description: 'Test description',
      isSystem: false,
    })

    assert.exists(permission.id)
    assert.equal(permission.name, 'Test Permission')
    assert.equal(permission.slug, 'test.permission')
    assert.equal(permission.category, 'test')
    assert.equal(permission.description, 'Test description')
    assert.isFalse(permission.isSystem)
    assert.exists(permission.createdAt)
  })

  test('roles: should preload roles relation', async ({ assert }) => {
    const role = await RoleFactory.create()
    const permission = await PermissionFactory.create()

    await role.related('permissions').attach([permission.id])
    await permission.load('roles')

    assert.lengthOf(permission.roles, 1)
    assert.equal(permission.roles[0].id, role.id)
  })

  test('roles: should handle multiple roles', async ({ assert }) => {
    const role1 = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const role2 = await RoleFactory.create({ name: 'Role 2', slug: 'role-2' })
    const role3 = await RoleFactory.create({ name: 'Role 3', slug: 'role-3' })
    const permission = await PermissionFactory.create()

    await role1.related('permissions').attach([permission.id])
    await role2.related('permissions').attach([permission.id])
    await role3.related('permissions').attach([permission.id])

    await permission.load('roles')

    assert.lengthOf(permission.roles, 3)
  })

  test('roles: should return empty array when no roles assigned', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    await permission.load('roles')

    assert.lengthOf(permission.roles, 0)
  })

  test('timestamps: should have createdAt', async ({ assert }) => {
    const permission = await PermissionFactory.create()

    assert.exists(permission.createdAt)
    assert.isTrue(permission.createdAt.isValid)
  })

  test('timestamps: should have updatedAt', async ({ assert }) => {
    const permission = await PermissionFactory.create()

    assert.exists(permission.updatedAt)
  })

  test('timestamps: should update updatedAt on save', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    const originalUpdatedAt = permission.updatedAt

    await new Promise((resolve) => setTimeout(resolve, 10))

    permission.name = 'Updated Name'
    await permission.save()

    await permission.refresh()
    assert.notEqual(permission.updatedAt?.toISO(), originalUpdatedAt?.toISO())
  })

  test('edge case: permission with null description', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      description: null,
    })

    assert.isNull(permission.description)
    assert.isTrue(permission.canBeModified)
  })

  test('edge case: permission with empty string description', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      description: '',
    })

    assert.equal(permission.description, '')
  })

  test('edge case: permission with long name', async ({ assert }) => {
    const longName = 'A'.repeat(100)
    const permission = await PermissionFactory.create({
      name: longName,
    })

    assert.equal(permission.name, longName)
  })

  test('consistency: system flag should not change', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: true })

    permission.name = 'Updated'
    await permission.save()

    await permission.refresh()
    assert.isTrue(permission.isSystem)
    assert.isFalse(permission.canBeDeleted)
    assert.isFalse(permission.canBeModified)
  })

  test('consistency: canBeDeleted and canBeModified should match isSystem', async ({ assert }) => {
    const systemPermission = await PermissionFactory.create({
      name: 'Permission 1',
      slug: 'permission-1',
      isSystem: true,
    })
    const normalPermission = await PermissionFactory.create({
      name: 'Permission 2',
      slug: 'permission-2',
      isSystem: false,
    })

    assert.equal(systemPermission.canBeDeleted, !systemPermission.isSystem)
    assert.equal(systemPermission.canBeModified, !systemPermission.isSystem)
    assert.equal(normalPermission.canBeDeleted, !normalPermission.isSystem)
    assert.equal(normalPermission.canBeModified, !normalPermission.isSystem)
  })

  test('real-world: typical permission structure', async ({ assert }) => {
    await Permission.query().delete()
    const permission = await PermissionFactory.create({
      name: 'Create Users',
      slug: 'users.create',
      category: 'users',
      description: 'Allows creating new users',
      isSystem: false,
    })

    assert.equal(permission.name, 'Create Users')
    assert.equal(permission.slug, 'users.create')
    assert.equal(permission.category, 'users')
    assert.isTrue(permission.canBeDeleted)
    assert.isTrue(permission.canBeModified)
  })

  test('real-world: system permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      name: 'Admin Access',
      slug: 'admin.access',
      category: 'system',
      description: 'Full admin access',
      isSystem: true,
    })

    assert.isFalse(permission.canBeDeleted)
    assert.isFalse(permission.canBeModified)
  })

  test('category: should store category as provided', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      category: 'custom_category',
    })

    assert.equal(permission.category, 'custom_category')
  })

  test('category: should handle mixed case', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      category: 'MixedCase',
    })

    assert.equal(permission.category, 'MixedCase')
  })

  test('slug: should be unique identifier', async ({ assert }) => {
    const perm1 = await PermissionFactory.create({ name: 'Unique name 1', slug: 'unique.slug.1' })
    const perm2 = await PermissionFactory.create({ name: 'Unique name 2', slug: 'unique.slug.2' })

    assert.notEqual(perm1.slug, perm2.slug)
  })

  test('multiple permissions: should maintain independence', async ({ assert }) => {
    const systemPerm = await PermissionFactory.create({
      name: 'Unique name 1',
      slug: 'unique.slug.1',
      isSystem: true,
    })
    const normalPerm = await PermissionFactory.create({
      name: 'Unique name 2',
      slug: 'unique.slug.2',
      isSystem: false,
    })

    assert.isFalse(systemPerm.canBeDeleted)
    assert.isTrue(normalPerm.canBeDeleted)
  })

  test('getters: should be computed dynamically', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: false })

    assert.isTrue(permission.canBeDeleted)
    assert.isTrue(permission.canBeModified)

    permission.isSystem = true

    assert.isFalse(permission.canBeDeleted)
    assert.isFalse(permission.canBeModified)
  })
})
