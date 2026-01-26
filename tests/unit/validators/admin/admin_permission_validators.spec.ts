import { test } from '@japa/runner'
import AdminPermissionValidators from '#admin/validators/admin_permission_validators'

test.group('AdminPermissionValidators', () => {
  test('list: should validate search and category', async ({ assert }) => {
    const validator = AdminPermissionValidators.list()
    const data = {
      search: 'test',
      category: 'users',
    }

    const result = await validator.validate(data)

    assert.equal(result.search, 'test')
    assert.equal(result.category, 'users')
  })

  test('list: should allow optional fields', async ({ assert }) => {
    const validator = AdminPermissionValidators.list()
    const data = {}

    const result = await validator.validate(data)

    assert.deepEqual(result, {})
  })

  test('create: should validate correct data', async ({ assert }) => {
    const validator = AdminPermissionValidators.create()
    const data = {
      name: 'Manage Users',
      category: 'Users',
      slug: 'users.manage',
      description: 'Allows managing users',
    }

    const result = await validator.validate(data)

    assert.equal(result.name, 'Manage Users')
    assert.equal(result.category, 'Users')
    assert.equal(result.slug, 'users.manage')
    assert.equal(result.description, 'Allows managing users')
  })

  test('create: should reject missing required fields', async ({ assert }) => {
    const validator = AdminPermissionValidators.create()
    const data = {
      name: 'Manage Users',
    }

    await assert.rejects(async () => validator.validate(data as any))
  })

  test('update: should validate correct data', async ({ assert }) => {
    const validator = AdminPermissionValidators.update()
    const data = {
      name: 'Updated Name',
      category: 'Updated Category',
      slug: 'updated-slug',
    }

    const result = await validator.validate(data)

    assert.equal(result.name, 'Updated Name')
    assert.equal(result.category, 'Updated Category')
    assert.equal(result.slug, 'updated-slug')
  })

  test('update: description is optional', async ({ assert }) => {
    const validator = AdminPermissionValidators.update()
    const data = {
      name: 'Updated Name',
      category: 'Updated Category',
      slug: 'updated-slug',
    }

    const result = await validator.validate(data)
    assert.isUndefined(result.description)
  })
})
