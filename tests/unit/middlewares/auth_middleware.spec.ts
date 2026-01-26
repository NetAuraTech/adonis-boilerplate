import { test } from '@japa/runner'
import AuthMiddleware from '#core/middleware/auth_middleware'
import { UserFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('AuthMiddleware', (group) => {
  let middleware: AuthMiddleware

  group.setup(async () => {
    middleware = await app.container.make(AuthMiddleware)
  })

  test('handle: should call next when user is authenticated', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
    assert.isTrue((ctx.auth.authenticateUsing as sinon.SinonStub).calledOnce)
  })

  test('handle: should authenticate with default guards', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(
      (ctx.auth.authenticateUsing as sinon.SinonStub).calledWith(undefined, {
        loginRoute: '/login',
      })
    )
  })

  test('handle: should authenticate with specific guards', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn, { guards: ['web'] })

    assert.isTrue(
      (ctx.auth.authenticateUsing as sinon.SinonStub).calledWith(['web'], { loginRoute: '/login' })
    )
  })

  test('handle: should throw when authentication fails', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null, throwOnAuth: true })

    await assert.rejects(async () => middleware.handle(ctx, nextFn))
  })

  test('handle: should not call next when authentication fails', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user: null, throwOnAuth: true })

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error) {
      // Expected
    }

    assert.isFalse(nextFn.called)
  })

  test('handle: should use custom redirect route', async ({ assert }) => {
    middleware.redirectTo = '/custom-login'

    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn)

    assert.isTrue(
      (ctx.auth.authenticateUsing as sinon.SinonStub).calledWith(undefined, {
        loginRoute: '/custom-login',
      })
    )
  })

  test('handle: should work with multiple guards', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn, { guards: ['web', 'api'] })

    assert.isTrue((ctx.auth.authenticateUsing as sinon.SinonStub).calledWith(['web', 'api']))
  })

  test('handle: should propagate authentication errors', async ({ assert }) => {
    const nextFn = sinon.spy()
    const authError = new Error('Authentication failed')
    const ctx = createMockContext({ user: null, throwOnAuth: true, authError })

    await assert.rejects(async () => middleware.handle(ctx, nextFn), 'Authentication failed')
  })

  test('edge case: should handle empty guards array', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn, { guards: [] })

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle undefined options', async ({ assert }) => {
    const user = await UserFactory.create()
    const nextFn = sinon.spy()
    const ctx = createMockContext({ user })

    await middleware.handle(ctx, nextFn, undefined)

    assert.isTrue(nextFn.calledOnce)
  })
})

interface MockContextOptions {
  user?: any
  throwOnAuth?: boolean
  authError?: Error
}

function createMockContext(options: MockContextOptions = {}): HttpContext {
  const { user = null, throwOnAuth = false, authError } = options

  const authenticateUsing = sinon.stub()

  if (throwOnAuth) {
    authenticateUsing.rejects(authError || new Error('Unauthenticated'))
  } else {
    authenticateUsing.resolves()
  }

  return {
    auth: {
      authenticateUsing,
      user,
      defaultGuard: 'web',
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
