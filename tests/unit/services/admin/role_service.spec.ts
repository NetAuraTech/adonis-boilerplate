import { test } from '@japa/runner'
import RoleService from '#admin/services/role_service'
import { RoleFactory, PermissionFactory, UserFactory } from '#tests/helpers/factories'
import Role from '#core/models/role'
import app from '@adonisjs/core/services/app'

test.group('RoleService', (group) => {
  let service: RoleService

  group.setup(async () => {
    service = await app.container.make(RoleService)
  })

  test('list: should return paginated roles', async ({ assert }) => {
    await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await RoleFactory.create({ name: 'Role 2', slug: 'role-2' })

    const result = await service.list({ page: 1, perPage: 10 })

    assert.isAtLeast(result.all().length, 2)
    assert.exists(result.getMeta())
  })

  test('list: should order by name', async ({ assert }) => {
    await RoleFactory.create({ name: 'Zebra', slug: 'zebra' })
    await RoleFactory.create({ name: 'Alpha', slug: 'alpha' })
    await RoleFactory.create({ name: 'Middle', slug: 'middle' })

    const result = await service.list({})

    const items = result.all()
    const alphaIndex = items.findIndex((r) => r.name === 'Alpha')
    const middleIndex = items.findIndex((r) => r.name === 'Middle')
    const zebraIndex = items.findIndex((r) => r.name === 'Zebra')

    assert.isTrue(alphaIndex < middleIndex)
    assert.isTrue(middleIndex < zebraIndex)
  })

  test('list: should filter by search term', async ({ assert }) => {
    await Role.query().delete()
    await RoleFactory.create({ name: 'Administrator', slug: 'administrator' })
    await RoleFactory.create({ name: 'User Manager', slug: 'user-manager' })
    await RoleFactory.create({ name: 'Guest', slug: 'guest' })

    const result = await service.list({ search: 'admin' })

    const items = result.all()
    assert.isTrue(items.some((r) => r.name.toLowerCase().includes('admin')))
  })

  test('list: should preload permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])

    const result = await service.list({})

    const item = result.all().find((r) => r.id === role.id)
    assert.exists(item)
    await item!.load('permissions')
    assert.isAtLeast(item!.permissions.length, 1)
  })

  test('list: should include users count', async ({ assert }) => {
    const role = await RoleFactory.create()
    await UserFactory.create({ roleId: role.id })
    await UserFactory.create({ roleId: role.id })

    const result = await service.list({})

    const item = result.all().find((r) => r.id === role.id)
    assert.exists(item)
    assert.equal(item!.$extras.users_count, 2)
  })

  test('list: should respect pagination', async ({ assert }) => {
    for (let i = 0; i < 25; i++) {
      await RoleFactory.create({ name: `Name ${i}`, slug: `role-${i}` })
    }

    const page1 = await service.list({ page: 1, perPage: 10 })
    const page2 = await service.list({ page: 2, perPage: 10 })

    assert.equal(page1.all().length, 10)
    assert.isAtLeast(page2.all().length, 1)

    const page1Ids = page1.all().map((r) => r.id)
    const page2Ids = page2.all().map((r) => r.id)

    assert.isFalse(page1Ids.some((id) => page2Ids.includes(id)))
  })

  test('detail: should return role with users count', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Test Role' })
    await UserFactory.create({ roleId: role.id })

    const result = await service.detail(role.id)

    assert.equal(result.id, role.id)
    assert.equal(result.name, 'Test Role')
    assert.equal(result.usersCount, 1)
  })

  test('detail: should include all role properties', async ({ assert }) => {
    const role = await RoleFactory.create({
      name: 'Test',
      slug: 'test-role',
      description: 'Test description',
      isSystem: false,
    })

    const result = await service.detail(role.id)

    assert.equal(result.name, 'Test')
    assert.equal(result.slug, 'test-role')
    assert.equal(result.description, 'Test description')
    assert.equal(result.isSystem, false)
    assert.equal(result.canBeDeleted, true)
    assert.equal(result.canBeModified, true)
  })

  test('detail: should throw for non-existent role', async ({ assert }) => {
    await assert.rejects(async () => service.detail(99999))
  })

  test('create: should create new role with permissions', async ({ assert }) => {
    const perm1 = await PermissionFactory.create({ name: 'Permission 1', slug: 'permission-1' })
    const perm2 = await PermissionFactory.create({ name: 'Permission 2', slug: 'permission-2' })

    const role = await service.create({
      name: 'New Role',
      description: 'Test description',
      permission_ids: [perm1.id, perm2.id],
    })

    assert.equal(role.name, 'New Role')
    assert.equal(role.slug, 'new-role')
    assert.equal(role.description, 'Test description')
    assert.isFalse(role.isSystem)

    await role.load('permissions')
    assert.equal(role.permissions.length, 2)
  })

  test('create: should generate slug from name', async ({ assert }) => {
    const role = await service.create({
      name: 'Super Admin Role',
      permission_ids: [],
    })

    assert.equal(role.slug, 'super-admin-role')
  })

  test('create: should handle special characters in slug', async ({ assert }) => {
    const role = await service.create({
      name: 'Role & Permission Manager',
      permission_ids: [],
    })

    assert.equal(role.slug, 'role-and-permission-manager')
  })

  test('create: should handle empty permission list', async ({ assert }) => {
    const role = await service.create({
      name: 'Empty Role',
      permission_ids: [],
    })

    await role.load('permissions')
    assert.equal(role.permissions.length, 0)
  })

  test('create: should handle optional description', async ({ assert }) => {
    const role = await service.create({
      name: 'Test',
      permission_ids: [],
    })

    assert.isUndefined(role.description)
  })

  test('update: should update role and sync permissions', async ({ assert }) => {
    const perm1 = await PermissionFactory.create({ name: 'Permission 1', slug: 'permission-1' })
    const perm2 = await PermissionFactory.create({ name: 'Permission 2', slug: 'permission-2' })
    const perm3 = await PermissionFactory.create({ name: 'Permission 3', slug: 'permission-3' })

    const role = await RoleFactory.create({ name: 'Old Name' })
    await role.related('permissions').attach([perm1.id, perm2.id])

    const updated = await service.update(role.id, {
      name: 'New Name',
      description: 'Updated',
      permission_ids: [perm2.id, perm3.id],
    })

    assert.equal(updated.name, 'New Name')
    assert.equal(updated.slug, 'new-name')
    assert.equal(updated.description, 'Updated')

    await updated.load('permissions')
    const permIds = updated.permissions.map((p) => p.id)
    assert.isTrue(permIds.includes(perm2.id))
    assert.isTrue(permIds.includes(perm3.id))
    assert.isFalse(permIds.includes(perm1.id))
  })

  test('update: should throw if role is system', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: true })

    await assert.rejects(
      async () =>
        service.update(role.id, {
          name: 'New Name',
          permission_ids: [],
        }),
      'Cannot modify system role'
    )
  })

  test('update: should not modify isSystem flag', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: false })

    await service.update(role.id, {
      name: 'Updated',
      permission_ids: [],
    })

    await role.refresh()
    assert.isFalse(role.isSystem)
  })

  test('delete: should delete role', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: false })

    await service.delete(role.id)

    const deleted = await Role.find(role.id)
    assert.isNull(deleted)
  })

  test('delete: should throw if role is system', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: true })

    await assert.rejects(async () => service.delete(role.id), 'Cannot delete system role')
  })

  test('delete: should throw if role has users', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: false })
    await UserFactory.create({ roleId: role.id })

    await assert.rejects(async () => service.delete(role.id))
  })

  test('delete: should not delete role with users', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: false })
    await UserFactory.create({ roleId: role.id })

    try {
      await service.delete(role.id)
    } catch (error) {
      // Expected
    }

    const stillExists = await Role.find(role.id)
    assert.isNotNull(stillExists)
  })

  test('getPermissionsByCategory: should group permissions by category', async ({ assert }) => {
    await PermissionFactory.create({ name: 'User Create', category: 'users', slug: 'uc' })
    await PermissionFactory.create({ name: 'User Delete', category: 'users', slug: 'ud' })
    await PermissionFactory.create({ name: 'Post Create', category: 'posts', slug: 'pc' })

    const grouped = await service.getPermissionsByCategory()

    assert.exists(grouped.users)
    assert.exists(grouped.posts)
    assert.isAtLeast(grouped.users.length, 2)
    assert.isAtLeast(grouped.posts.length, 1)
  })

  test('getPermissionsByCategory: should mark assigned permissions when roleId provided', async ({
    assert,
  }) => {
    const perm1 = await PermissionFactory.create({ category: 'users', slug: 'p1' })
    const perm2 = await PermissionFactory.create({ category: 'users', slug: 'p2' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([perm1.id])

    const grouped = await service.getPermissionsByCategory(role.id)

    const assignedPerm = grouped.users.find((p) => p.id === perm1.id)
    const unassignedPerm = grouped.users.find((p) => p.id === perm2.id)

    assert.isTrue(assignedPerm?.assigned)
    assert.isFalse(unassignedPerm?.assigned)
  })

  test('getPermissionsByCategory: should order by category and name', async ({ assert }) => {
    await PermissionFactory.create({ name: 'Z Permission', category: 'users', slug: 'z' })
    await PermissionFactory.create({ name: 'A Permission', category: 'users', slug: 'a' })
    await PermissionFactory.create({ name: 'M Permission', category: 'posts', slug: 'm' })

    const grouped = await service.getPermissionsByCategory()

    const usersPerms = grouped.users
    assert.isTrue(usersPerms[0].name < usersPerms[1].name)
  })

  test('getPermissionsByCategory: should include permission details', async ({ assert }) => {
    await PermissionFactory.create({
      name: 'Test',
      slug: 'test-perm',
      category: 'test',
      description: 'Description',
      isSystem: false,
    })

    const grouped = await service.getPermissionsByCategory()

    const perm = grouped.test[0]
    assert.exists(perm.id)
    assert.exists(perm.name)
    assert.exists(perm.slug)
    assert.exists(perm.description)
    assert.property(perm, 'isSystem')
    assert.property(perm, 'assigned')
  })

  test('getPermissionsByCategory: should handle role without permissions', async ({ assert }) => {
    await PermissionFactory.create({ category: 'users', slug: 'p1' })
    const role = await RoleFactory.create()

    const grouped = await service.getPermissionsByCategory(role.id)

    const perm = grouped.users[0]
    assert.isFalse(perm.assigned)
  })

  test('getPermissionsByCategory: should handle empty permissions', async ({ assert }) => {
    const grouped = await service.getPermissionsByCategory()

    assert.isObject(grouped)
  })

  test('full workflow: create, update, delete', async ({ assert }) => {
    const perm1 = await PermissionFactory.create()

    const role = await service.create({
      name: 'Test Role',
      permission_ids: [perm1.id],
    })

    assert.exists(role.id)

    const perm2 = await PermissionFactory.create()
    const updated = await service.update(role.id, {
      name: 'Updated Role',
      permission_ids: [perm2.id],
    })

    assert.equal(updated.name, 'Updated Role')

    await service.delete(role.id)

    const deleted = await Role.find(role.id)
    assert.isNull(deleted)
  })

  test('edge case: create role with very long name', async ({ assert }) => {
    const longName = 'A'.repeat(50)
    const role = await service.create({
      name: longName,
      permission_ids: [],
    })

    assert.equal(role.name, longName)
  })

  test('edge case: update removes all permissions', async ({ assert }) => {
    const perm = await PermissionFactory.create()
    const role = await RoleFactory.create()
    await role.related('permissions').attach([perm.id])

    await service.update(role.id, {
      name: role.name,
      permission_ids: [],
    })

    await role.load('permissions')
    assert.equal(role.permissions.length, 0)
  })

  test('edge case: search with special characters', async ({ assert }) => {
    await RoleFactory.create({ name: 'Test & Role', slug: 'test-and-role' })

    const result = await service.list({ search: 'Test &' })

    assert.isAtLeast(result.all().length, 0)
  })

  test('list: should handle role without users', async ({ assert }) => {
    const role = await RoleFactory.create()

    const result = await service.list({})

    const item = result.all().find((r) => r.id === role.id)
    assert.equal(item!.$extras.users_count, 0)
  })

  test('detail: should handle role without users', async ({ assert }) => {
    const role = await RoleFactory.create()

    const result = await service.detail(role.id)

    assert.equal(result.usersCount, 0)
  })

  test('create: should sync permissions correctly', async ({ assert }) => {
    const perms = await Promise.all([
      PermissionFactory.create({ name: 'Permission 1', slug: 'permission-1' }),
      PermissionFactory.create({ name: 'Permission 2', slug: 'permission-2' }),
      PermissionFactory.create({ name: 'Permission 3', slug: 'permission-3' }),
    ])

    const role = await service.create({
      name: 'Test',
      permission_ids: perms.map((p) => p.id),
    })

    await role.load('permissions')
    assert.equal(role.permissions.length, 3)
  })

  test('update: should handle duplicate permission IDs', async ({ assert }) => {
    const perm = await PermissionFactory.create()
    const role = await RoleFactory.create()

    await service.update(role.id, {
      name: 'Test',
      permission_ids: [perm.id, perm.id, perm.id],
    })

    await role.load('permissions')
    assert.equal(role.permissions.length, 1)
  })

  test('getPermissionsByCategory: should handle multiple categories', async ({ assert }) => {
    await PermissionFactory.create({ category: 'cat1', slug: 'c1' })
    await PermissionFactory.create({ category: 'cat2', slug: 'c2' })
    await PermissionFactory.create({ category: 'cat3', slug: 'c3' })

    const grouped = await service.getPermissionsByCategory()

    assert.exists(grouped.cat1)
    assert.exists(grouped.cat2)
    assert.exists(grouped.cat3)
  })

  test('delete: should handle role with multiple users', async ({ assert }) => {
    const role = await RoleFactory.create({ isSystem: false })
    await UserFactory.create({ roleId: role.id })
    await UserFactory.create({ roleId: role.id })
    await UserFactory.create({ roleId: role.id })

    await assert.rejects(async () => service.delete(role.id))
  })
})
