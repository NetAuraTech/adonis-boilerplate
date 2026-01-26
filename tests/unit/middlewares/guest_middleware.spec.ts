import { test } from '@japa/runner'
import GuestMiddleware from '#core/middleware/guest_middleware'
import { UserFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('GuestMiddleware', (group) => {
  let middleware: GuestMiddleware

  group.setup(async () => {
    middleware = await app.container.make(GuestMiddleware)
  })

  test('handle: should call next when user is not authenticated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: false })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should redirect when user is authenticated', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: true, user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue((ctx.response.redirect as sinon.SinonStub).calledWith('/', true))
    assert.isFalse(nextFn.called)
  })

  test('handle: should not call next when user is authenticated', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: true, user })

    await middleware.handle(ctx, nextFn)

    assert.isFalse(nextFn.called)
  })

  test('handle: should use custom redirect route', async ({ assert }) => {
    middleware.redirectTo = '/dashboard'

    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: true, user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue((ctx.response.redirect as sinon.SinonStub).calledWith('/dashboard', true))
  })

  test('handle: should check default guard when no guards specified', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: true, user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue((ctx.auth.use as sinon.SinonStub).calledWith('web'))
  })

  test('handle: should check specific guards', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: true, user })

    await middleware.handle(ctx, nextFn, { guards: ['api'] })

    assert.isTrue((ctx.auth.use as sinon.SinonStub).calledWith('api'))
  })

  test('handle: should check multiple guards', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      authenticated: false,
      multipleGuards: true,
    })

    await middleware.handle(ctx, nextFn, { guards: ['web', 'api'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should redirect if any guard is authenticated', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      authenticated: true,
      user,
      multipleGuards: true,
      authenticatedGuards: ['api'],
    })

    await middleware.handle(ctx, nextFn, { guards: ['web', 'api'] })

    assert.isFalse(nextFn.called)
    assert.isTrue((ctx.response.redirect as sinon.SinonStub).called)
  })

  test('handle: should call next if no guard is authenticated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({
      authenticated: false,
      multipleGuards: true,
    })

    await middleware.handle(ctx, nextFn, { guards: ['web', 'api'] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle empty guards array', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: false })

    await middleware.handle(ctx, nextFn, { guards: [] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle undefined options', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: false })

    await middleware.handle(ctx, nextFn, undefined)

    assert.isTrue(nextFn.calledOnce)
  })

  test('real-world: login page should not be accessible when authenticated', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: true, user })

    await middleware.handle(ctx, nextFn)

    assert.isFalse(nextFn.called)
    assert.isTrue((ctx.response.redirect as sinon.SinonStub).called)
  })

  test('real-world: register page should be accessible when not authenticated', async ({
    assert,
  }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ authenticated: false })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })
})

interface MockContextOptions {
  authenticated?: boolean
  user?: any
  multipleGuards?: boolean
  authenticatedGuards?: string[]
}

const createMockContext = (options: MockContextOptions = {}): HttpContext => {
  const {
    authenticated = false,
    user = null,
    multipleGuards = false,
    authenticatedGuards = [],
  } = options

  const checkStub = sinon.stub().resolves(authenticated)
  const useStub = sinon.stub().returns({ check: checkStub })

  if (multipleGuards) {
    useStub.callsFake((guard: string) => ({
      check: sinon.stub().resolves(authenticatedGuards.includes(guard)),
    }))
  }

  return {
    auth: {
      user,
      defaultGuard: 'web',
      use: useStub,
    },
    request: {
      url: () => '/login',
      method: () => 'GET',
    },
    response: {
      redirect: sinon.stub().returnsThis(),
      status: sinon.stub().returnsThis(),
    },
  } as any
}
