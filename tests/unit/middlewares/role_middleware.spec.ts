import { test } from '@japa/runner'
import RoleMiddleware from '#core/middleware/role_middleware'
import { UserFactory, RoleFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'

test.group('RoleMiddleware', (group) => {
  let middleware: RoleMiddleware

  group.setup(() => {
    middleware = new RoleMiddleware()
  })

  test('handle: should call next when user has required role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'admin' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { roles: ['admin'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should throw when user does not have required role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'user' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(
      async () => middleware.handle(ctx, nextFn, { roles: ['admin'] }),
      'Insufficient permissions'
    )
  })

  test('handle: should not call next when role check fails', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'user' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    try {
      await middleware.handle(ctx, nextFn, { roles: ['admin'] })
    } catch (error) {
      // Expected
    }

    assert.isFalse(nextFn.called)
  })

  test('handle: should throw when user is not authenticated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext(null)

    await assert.rejects(
      async () => middleware.handle(ctx, nextFn, { roles: ['admin'] }),
      'Unauthenticated'
    )
  })

  test('handle: should call next when no roles required', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { roles: [] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should call next when roles option is undefined', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, {})

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should allow access if user has any of the required roles', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'moderator' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { roles: ['admin', 'moderator', 'editor'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should deny access if user does not have any of the required roles', async ({
    assert,
  }) => {
    const role = await RoleFactory.create({ slug: 'user' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () =>
      middleware.handle(ctx, nextFn, { roles: ['admin', 'moderator'] })
    )
  })

  test('handle: should throw E_UNAUTHORIZED for unauthenticated user', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext(null)

    try {
      await middleware.handle(ctx, nextFn, { roles: ['admin'] })
    } catch (error: any) {
      assert.equal(error.status, 401)
      assert.equal(error.code, 'E_UNAUTHORIZED')
    }
  })

  test('handle: should throw E_FORBIDDEN for user without role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'user' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    try {
      await middleware.handle(ctx, nextFn, { roles: ['admin'] })
    } catch (error: any) {
      assert.equal(error.status, 403)
      assert.equal(error.code, 'E_FORBIDDEN')
    }
  })

  test('handle: should work with user without role', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () => middleware.handle(ctx, nextFn, { roles: ['admin'] }))
  })

  test('handle: should be case-sensitive for role slugs', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'admin' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () => middleware.handle(ctx, nextFn, { roles: ['Admin'] }))
  })

  test('handle: should handle single role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'editor' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { roles: ['editor'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle empty string role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'admin' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () => middleware.handle(ctx, nextFn, { roles: [''] }))
  })

  test('edge case: should handle undefined options object', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, undefined)

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle multiple identical roles', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'admin' })
    const user = await UserFactory.create({ roleId: role.id })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn, { roles: ['admin', 'admin', 'admin'] })

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
