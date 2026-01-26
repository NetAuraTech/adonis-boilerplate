import { test } from '@japa/runner'
import PermissionMiddleware from '#core/middleware/permission_middleware'
import { UserFactory, RoleFactory, PermissionFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('PermissionMiddleware', (group) => {
  let middleware: PermissionMiddleware

  group.setup(async () => {
    middleware = await app.container.make(PermissionMiddleware)
  })

  test('handle: should call next when user has required permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({ slug: 'users.create' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])
    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { permissions: ['users.create'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should throw when user does not have required permission', async ({ assert }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(
      async () => middleware.handle(ctx, nextFn, { permissions: ['users.delete'] }),
      'Insufficient permissions'
    )
  })

  test('handle: should not call next when permission check fails', async ({ assert }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    try {
      await middleware.handle(ctx, nextFn, { permissions: ['users.delete'] })
    } catch (error) {
      // Expected
    }

    assert.isFalse(nextFn.called)
  })

  test('handle: should throw when user is not authenticated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext(null)

    await assert.rejects(
      async () => middleware.handle(ctx, nextFn, { permissions: ['users.create'] }),
      'Unauthenticated'
    )
  })

  test('handle: should call next when no permissions required', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { permissions: [] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should call next when permissions option is undefined', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, {})

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should check multiple permissions (require all)', async ({ assert }) => {
    const perm1 = await PermissionFactory.create({ slug: 'users.create' })
    const perm2 = await PermissionFactory.create({ slug: 'users.edit' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([perm1.id, perm2.id])
    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { permissions: ['users.create', 'users.edit'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should throw E_UNAUTHORIZED for unauthenticated user', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext(null)

    try {
      await middleware.handle(ctx, nextFn, { permissions: ['users.create'] })
    } catch (error: any) {
      assert.equal(error.status, 401)
      assert.equal(error.code, 'E_UNAUTHORIZED')
    }
  })

  test('handle: should throw E_FORBIDDEN for user without permission', async ({ assert }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    try {
      await middleware.handle(ctx, nextFn, { permissions: ['users.delete'] })
    } catch (error: any) {
      assert.equal(error.status, 403)
      assert.equal(error.code, 'E_FORBIDDEN')
    }
  })

  test('handle: should work with user without role', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () =>
      middleware.handle(ctx, nextFn, { permissions: ['users.create'] })
    )
  })

  test('edge case: should handle empty string permission', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () => middleware.handle(ctx, nextFn, { permissions: [''] }))
  })

  test('edge case: should handle undefined options object', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, undefined)

    assert.isTrue(nextFn.calledOnce)
  })
})

const createMockContext = (user: any): HttpContext => {
  return {
    auth: {
      user,
    },
    request: {
      url: () => '/test',
      method: () => 'GET',
    },
    response: {
      redirect: sinon.stub().returnsThis(),
      status: sinon.stub().returnsThis(),
    },
  } as any
}
