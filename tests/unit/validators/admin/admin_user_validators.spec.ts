import { test } from '@japa/runner'
import AdminUserValidators from '#admin/validators/admin_user_validators'
import { UserFactory } from '#tests/helpers/factories'

test.group('AdminUserValidators', () => {
  test('id: should validate numeric id', async ({ assert }) => {
    const validator = AdminUserValidators.id()
    const data = { id: 1 }

    const result = await validator.validate(data)
    assert.equal(result.id, 1)
  })

  test('list: should validate search and role', async ({ assert }) => {
    const validator = AdminUserValidators.list(['admin', 'user'])
    const data = {
      search: 'john',
      role: 'admin',
    }

    const result = await validator.validate(data)
    assert.equal(result.search, 'john')
    assert.equal(result.role, 'admin')
  })

  test('list: should reject invalid role', async ({ assert }) => {
    const validator = AdminUserValidators.list(['admin', 'user'])
    const data = {
      role: 'invalid',
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('create: should validate correct data', async ({ assert }) => {
    const validator = AdminUserValidators.create([1, 2])
    const data = {
      email: 'new-user@example.com',
      fullName: 'New User',
      role_id: 1,
    }

    const result = await validator.validate(data)
    assert.equal(result.email, 'new-user@example.com')
    assert.equal(result.fullName, 'New User')
    assert.equal(result.role_id, 1)
  })

  test('create: should reject duplicate email', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'existing@example.com' })
    const validator = AdminUserValidators.create([1])
    const data = {
      email: user.email,
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('update: should validate correct data', async ({ assert }) => {
    const validator = AdminUserValidators.update(1, [1, 2])
    const data = {
      fullName: 'Updated User',
      email: 'updated@example.com',
      role_id: 2,
    }

    const result = await validator.validate(data)
    assert.equal(result.fullName, 'Updated User')
    assert.equal(result.email, 'updated@example.com')
    assert.equal(result.role_id, 2)
  })

  test('update: should allow same email for the same user', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'keep@example.com' })
    const validator = AdminUserValidators.update(user.id, [1])
    const data = {
      email: user.email,
    }

    const result = await validator.validate(data)
    assert.equal(result.email, user.email)
  })
})
