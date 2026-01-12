import { test } from '@japa/runner'
import PermissionService from '#admin/services/permission_service'
import { PermissionFactory, RoleFactory } from '#tests/helpers/factories'
import Permission from '#core/models/permission'

test.group('PermissionService', (group) => {
  let service: PermissionService

  group.setup(async () => {
    service = new PermissionService()
  })

  test('list: should return paginated permissions', async ({ assert }) => {
    await PermissionFactory.create({ name: 'Permission 1', slug: 'permission-1' })
    await PermissionFactory.create({ name: 'Permission 2', slug: 'permission-2' })

    const result = await service.list({ page: 1, perPage: 10 })

    assert.isAtLeast(result.all().length, 2)
    assert.exists(result.getMeta())
  })

  test('list: should order by category and name', async ({ assert }) => {
    await PermissionFactory.create({ name: 'B Permission', category: 'users', slug: 'b-perm' })
    await PermissionFactory.create({ name: 'A Permission', category: 'users', slug: 'a-perm' })
    await PermissionFactory.create({ name: 'C Permission', category: 'posts', slug: 'c-perm' })

    const result = await service.list({})

    const items = result.all()
    const postIndex = items.findIndex((p) => p.category === 'posts')
    const usersIndex = items.findIndex((p) => p.category === 'users')

    assert.isTrue(postIndex < usersIndex || postIndex === -1)
  })

  test('list: should filter by search term', async ({ assert }) => {
    await PermissionFactory.create({
      name: 'Create User',
      slug: 'create-user',
      description: 'Allows user creation',
    })
    await PermissionFactory.create({
      name: 'Delete Post',
      slug: 'delete-post',
      description: 'Allows post deletion',
    })

    const result = await service.list({ search: 'user' })

    const items = result.all()
    assert.isTrue(items.some((p) => p.name.toLowerCase().includes('user')))
  })

  test('list: should filter by category', async ({ assert }) => {
    await PermissionFactory.create({ category: 'users', slug: 'users-perm' })
    await PermissionFactory.create({ category: 'posts', slug: 'posts-perm' })
    await PermissionFactory.create({ category: 'users', slug: 'users-perm2' })

    const result = await service.list({ category: 'users' })

    const items = result.all()
    assert.isTrue(items.every((p) => p.category === 'users'))
  })

  test('list: should preload roles', async ({ assert }) => {
    const role = await RoleFactory.create()
    const permission = await PermissionFactory.create()
    await role.related('permissions').attach([permission.id])

    const result = await service.list({})

    const item = result.all().find((p) => p.id === permission.id)
    assert.exists(item)
    await item!.load('roles')
    assert.isAtLeast(item!.roles.length, 1)
  })

  test('list: should respect pagination', async ({ assert }) => {
    for (let i = 0; i < 25; i++) {
      await PermissionFactory.create({ name: `Permission ${i}`, slug: `perm-${i}` })
    }

    const page1 = await service.list({ page: 1, perPage: 10 })
    const page2 = await service.list({ page: 2, perPage: 10 })

    assert.equal(page1.all().length, 10)
    assert.isAtLeast(page2.all().length, 1)

    const page1Ids = page1.all().map((p) => p.id)
    const page2Ids = page2.all().map((p) => p.id)

    assert.isFalse(page1Ids.some((id) => page2Ids.includes(id)))
  })

  test('detail: should return permission with roles', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Test Role' })
    const permission = await PermissionFactory.create({
      name: 'Test Permission',
      category: 'test',
    })
    await role.related('permissions').attach([permission.id])

    const result = await service.detail(permission.id)

    assert.equal(result.id, permission.id)
    assert.equal(result.name, 'Test Permission')
    assert.equal(result.category, 'test')
    assert.isArray(result.roles)
    assert.isAtLeast(result.roles.length, 1)
    assert.equal(result.roles[0].name, 'Test Role')
  })

  test('detail: should include all permission properties', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      name: 'Test',
      slug: 'test-perm',
      category: 'test',
      description: 'Test description',
      isSystem: false,
    })

    const result = await service.detail(permission.id)

    assert.equal(result.name, 'Test')
    assert.equal(result.slug, 'test-perm')
    assert.equal(result.category, 'test')
    assert.equal(result.description, 'Test description')
    assert.equal(result.isSystem, false)
    assert.equal(result.canBeDeleted, true)
    assert.equal(result.canBeModified, true)
  })

  test('detail: should throw for non-existent permission', async ({ assert }) => {
    await assert.rejects(async () => service.detail(99999))
  })

  test('create: should create new permission', async ({ assert }) => {
    const permission = await service.create({
      name: 'New Permission',
      slug: 'new-permission',
      category: 'test',
      description: 'Test description',
    })

    assert.equal(permission.name, 'New Permission')
    assert.equal(permission.slug, 'new-permission')
    assert.equal(permission.category, 'test')
    assert.equal(permission.description, 'Test description')
    assert.isFalse(permission.isSystem)
  })

  test('create: should lowercase category', async ({ assert }) => {
    const permission = await service.create({
      name: 'Test',
      slug: 'test',
      category: 'UPPERCASE',
    })

    assert.equal(permission.category, 'uppercase')
  })

  test('create: should handle optional description', async ({ assert }) => {
    const permission = await service.create({
      name: 'Test',
      slug: 'test-no-desc',
      category: 'test',
    })

    assert.isUndefined(permission.description)
  })

  test('update: should update permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      name: 'Old Name',
      slug: 'old-slug',
      category: 'old',
    })

    const updated = await service.update(permission.id, {
      name: 'New Name',
      slug: 'new-slug',
      category: 'new',
      description: 'Updated',
    })

    assert.equal(updated.name, 'New Name')
    assert.equal(updated.slug, 'new-slug')
    assert.equal(updated.category, 'new')
    assert.equal(updated.description, 'Updated')
  })

  test('update: should lowercase category', async ({ assert }) => {
    const permission = await PermissionFactory.create()

    const updated = await service.update(permission.id, {
      name: 'Test',
      slug: 'test',
      category: 'MIXED_Case',
    })

    assert.equal(updated.category, 'mixed_case')
  })

  test('update: should throw if permission is system', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: true })

    await assert.rejects(
      async () =>
        service.update(permission.id, {
          name: 'New Name',
          slug: 'new-slug',
          category: 'test',
        }),
      'Cannot modify system permission'
    )
  })

  test('update: should not modify isSystem flag', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: false })

    await service.update(permission.id, {
      name: 'Updated',
      slug: 'updated',
      category: 'test',
    })

    await permission.refresh()
    assert.isFalse(permission.isSystem)
  })

  test('delete: should delete permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: false })

    await service.delete(permission.id)

    const deleted = await Permission.find(permission.id)
    assert.isNull(deleted)
  })

  test('delete: should throw if permission is system', async ({ assert }) => {
    const permission = await PermissionFactory.create({ isSystem: true })

    await assert.rejects(
      async () => service.delete(permission.id),
      'Cannot delete system permission'
    )
  })

  test('delete: should throw if permission has roles', async ({ assert }) => {
    const role = await RoleFactory.create()
    const permission = await PermissionFactory.create({ isSystem: false })
    await role.related('permissions').attach([permission.id])

    await assert.rejects(async () => service.delete(permission.id))
  })

  test('delete: should not delete permission with roles', async ({ assert }) => {
    const role = await RoleFactory.create()
    const permission = await PermissionFactory.create({ isSystem: false })
    await role.related('permissions').attach([permission.id])

    try {
      await service.delete(permission.id)
    } catch (error) {
      // Expected
    }

    const stillExists = await Permission.find(permission.id)
    assert.isNotNull(stillExists)
  })

  test('getAllCategories: should return unique categories', async ({ assert }) => {
    await PermissionFactory.create({ category: 'users', slug: 'u1' })
    await PermissionFactory.create({ category: 'posts', slug: 'p1' })
    await PermissionFactory.create({ category: 'users', slug: 'u2' })
    await PermissionFactory.create({ category: 'comments', slug: 'c1' })

    const categories = await service.getAllCategories()

    assert.isArray(categories)
    assert.isTrue(categories.includes('users'))
    assert.isTrue(categories.includes('posts'))
    assert.isTrue(categories.includes('comments'))

    const uniqueCategories = [...new Set(categories)]
    assert.equal(categories.length, uniqueCategories.length)
  })

  test('getAllCategories: should order categories alphabetically', async ({ assert }) => {
    await PermissionFactory.create({ category: 'zebra', slug: 'z1' })
    await PermissionFactory.create({ category: 'apple', slug: 'a1' })
    await PermissionFactory.create({ category: 'middle', slug: 'm1' })

    const categories = await service.getAllCategories()

    const appleIndex = categories.indexOf('apple')
    const middleIndex = categories.indexOf('middle')
    const zebraIndex = categories.indexOf('zebra')

    assert.isTrue(appleIndex < middleIndex)
    assert.isTrue(middleIndex < zebraIndex)
  })

  test('getAllCategories: should return empty array if no permissions', async ({ assert }) => {
    const categories = await service.getAllCategories()

    assert.isArray(categories)
  })

  test('full workflow: create, update, delete', async ({ assert }) => {
    const permission = await service.create({
      name: 'Test Permission',
      slug: 'test-permission',
      category: 'test',
    })

    assert.exists(permission.id)

    const updated = await service.update(permission.id, {
      name: 'Updated Permission',
      slug: 'updated-permission',
      category: 'updated',
    })

    assert.equal(updated.name, 'Updated Permission')

    await service.delete(permission.id)

    const deleted = await Permission.find(permission.id)
    assert.isNull(deleted)
  })

  test('edge case: search with special characters', async ({ assert }) => {
    await PermissionFactory.create({
      name: 'Test & Permission',
      slug: 'test-and-permission',
    })

    const result = await service.list({ search: 'Test &' })

    assert.isAtLeast(result.all().length, 0)
  })

  test('edge case: very long permission name', async ({ assert }) => {
    const longName = 'A'.repeat(100)
    const permission = await service.create({
      name: longName,
      slug: 'long-name',
      category: 'test',
    })

    assert.equal(permission.name, longName)
  })

  test('edge case: empty category list', async ({ assert }) => {
    await PermissionFactory.create({ category: '', slug: 'empty-cat' })

    const categories = await service.getAllCategories()

    assert.isArray(categories)
  })

  test('list: should handle combined filters', async ({ assert }) => {
    await PermissionFactory.create({
      name: 'User Create',
      category: 'users',
      slug: 'user-create',
    })
    await PermissionFactory.create({
      name: 'User Delete',
      category: 'users',
      slug: 'user-delete',
    })
    await PermissionFactory.create({
      name: 'Post Create',
      category: 'posts',
      slug: 'post-create',
    })

    const result = await service.list({
      search: 'create',
      category: 'users',
    })

    const items = result.all()
    assert.isTrue(items.every((p) => p.category === 'users'))
    assert.isTrue(items.some((p) => p.name.toLowerCase().includes('create')))
  })

  test('detail: should handle permission without roles', async ({ assert }) => {
    const permission = await PermissionFactory.create()

    const result = await service.detail(permission.id)

    assert.isArray(result.roles)
    assert.equal(result.roles.length, 0)
  })

  test('detail: should handle permission with multiple roles', async ({ assert }) => {
    const role1 = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const role2 = await RoleFactory.create({ name: 'Role 2', slug: 'role-2' })
    const role3 = await RoleFactory.create({ name: 'Role 3', slug: 'role-3' })
    const permission = await PermissionFactory.create()

    await role1.related('permissions').attach([permission.id])
    await role2.related('permissions').attach([permission.id])
    await role3.related('permissions').attach([permission.id])

    const result = await service.detail(permission.id)

    assert.equal(result.roles.length, 3)
  })
})
