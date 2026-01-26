import { test } from '@japa/runner'
import SilentAuthMiddleware from '#core/middleware/silent_auth_middleware'
import { UserFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('SilentAuthMiddleware', (group) => {
  let middleware: SilentAuthMiddleware

  group.setup(async () => {
    middleware = await app.container.make(SilentAuthMiddleware)
  })

  test('handle: should call next when user is authenticated', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
    assert.isTrue((ctx.auth.check as sinon.SinonStub).calledOnce)
  })

  test('handle: should call next when user is not authenticated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
    assert.isTrue((ctx.auth.check as sinon.SinonStub).calledOnce)
  })

  test('handle: should not throw when authentication fails', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null })

    await assert.doesNotReject(async () => middleware.handle(ctx, nextFn))
  })

  test('handle: should call auth.check()', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue((ctx.auth.check as sinon.SinonStub).calledOnce)
  })

  test('handle: should always call next regardless of auth status', async ({ assert }) => {
    const nextFn1 = sinon.spy()
    const nextFn2 = sinon.spy()

    const authenticatedCtx = createMockContext({ user: await UserFactory.create() })
    const unauthenticatedCtx = createMockContext({ user: null })

    await middleware.handle(authenticatedCtx, nextFn1)
    await middleware.handle(unauthenticatedCtx, nextFn2)

    assert.isTrue(nextFn1.calledOnce)
    assert.isTrue(nextFn2.calledOnce)
  })

  test('handle: should not redirect or throw errors', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null })

    await middleware.handle(ctx, nextFn)

    assert.isFalse((ctx.response.redirect as sinon.SinonStub).called)
    assert.isTrue(nextFn.calledOnce)
  })

  test('real-world: should allow public pages to access auth.user if available', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.exists(ctx.auth.user)
    assert.equal(ctx.auth.user!.id, user.id)
  })

  test('real-world: should allow public pages to work without auth.user', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null })

    await middleware.handle(ctx, nextFn)

    assert.isNull(ctx.auth.user)
    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: check errors are propagated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const checkStub = sinon.stub().rejects(new Error('Auth check failed'))
    const ctx = {
      auth: {
        check: checkStub,
        user: null,
      },
      request: {
        url: () => '/test',
      },
      response: {
        redirect: sinon.stub().returnsThis(),
      },
    } as any

    // Current behavior: errors are propagated (not caught)
    await assert.rejects(async () => middleware.handle(ctx, nextFn), 'Auth check failed')
  })

  test('consistency: multiple calls should behave the same', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)
    await middleware.handle(ctx, nextFn)
    await middleware.handle(ctx, nextFn)

    assert.equal(nextFn.callCount, 3)
    assert.equal((ctx.auth.check as sinon.SinonStub).callCount, 3)
  })

  test('difference from auth middleware: should not block unauthenticated users', async ({
    assert,
  }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
    assert.isFalse((ctx.response.redirect as sinon.SinonStub).called)
  })

  test('use case: landing page with optional user info', async ({ assert }) => {
    const authenticatedNextFn = sinon.spy()
    const unauthenticatedNextFn = sinon.spy()

    const authenticatedUser = await UserFactory.create()
    const authenticatedCtx = createMockContext({ user: authenticatedUser })
    const unauthenticatedCtx = createMockContext({ user: null })

    await middleware.handle(authenticatedCtx, authenticatedNextFn)
    await middleware.handle(unauthenticatedCtx, unauthenticatedNextFn)

    assert.isTrue(authenticatedNextFn.calledOnce)
    assert.isTrue(unauthenticatedNextFn.calledOnce)
    assert.exists(authenticatedCtx.auth.user)
    assert.isNull(unauthenticatedCtx.auth.user)
  })
})

interface MockContextOptions {
  user?: any
}

const createMockContext = (options: MockContextOptions = {}): HttpContext => {
  const { user = null } = options

  return {
    auth: {
      user,
      check: sinon.stub().resolves(),
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
