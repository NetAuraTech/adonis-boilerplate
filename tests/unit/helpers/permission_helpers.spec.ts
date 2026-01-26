import { test } from '@japa/runner'
import { can, hasRole, hasAnyRole, isAdmin } from '#core/helpers/permission'
import { UserFactory, RoleFactory, PermissionFactory } from '#tests/helpers/factories'

test.group('Core Helpers / Permission', () => {
  test('can: should return true if user has permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({ slug: 'test.permission' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])
    const user = await UserFactory.create({ roleId: role.id })

    assert.isTrue(await can(user, 'test.permission'))
  })

  test('can: should return false if user is null', async ({ assert }) => {
    assert.isFalse(await can(null, 'test.permission'))
  })

  test('hasRole: should return true if user has role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'test-role' })
    const user = await UserFactory.create({ roleId: role.id })

    assert.isTrue(await hasRole(user, 'test-role'))
  })

  test('hasAnyRole: should return true if user has one of the roles', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'role-b' })
    const user = await UserFactory.create({ roleId: role.id })

    assert.isTrue(await hasAnyRole(user, ['role-a', 'role-b']))
  })

  test('isAdmin: should return true if user is admin', async ({ assert }) => {
    const adminRole = await RoleFactory.create({ slug: 'admin' })
    const user = await UserFactory.create({ roleId: adminRole.id })

    assert.isTrue(await isAdmin(user))
  })
})
