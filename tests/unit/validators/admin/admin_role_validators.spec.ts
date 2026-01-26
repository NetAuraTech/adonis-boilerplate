import { test } from '@japa/runner'
import AdminRoleValidators from '#admin/validators/admin_role_validators'

test.group('AdminRoleValidators', () => {
  test('create: should validate correct data', async ({ assert }) => {
    const validator = AdminRoleValidators.create()
    const data = {
      name: 'Editor',
      description: 'Content editor',
      permission_ids: [1, 2, 3],
    }

    const result = await validator.validate(data)

    assert.equal(result.name, 'Editor')
    assert.equal(result.description, 'Content editor')
    assert.deepEqual(result.permission_ids, [1, 2, 3])
  })

  test('create: should reject missing permission_ids', async ({ assert }) => {
    const validator = AdminRoleValidators.create()
    const data = {
      name: 'Editor',
    }

    await assert.rejects(async () => validator.validate(data as any))
  })

  test('update: should validate correct data', async ({ assert }) => {
    const validator = AdminRoleValidators.update()
    const data = {
      name: 'Super Editor',
      permission_ids: [1],
    }

    const result = await validator.validate(data)

    assert.equal(result.name, 'Super Editor')
    assert.deepEqual(result.permission_ids, [1])
  })
})
