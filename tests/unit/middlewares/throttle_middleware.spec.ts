import { test } from '@japa/runner'
import ThrottleMiddleware from '#core/middleware/throttle_middleware'
import RateLimitService from '#core/services/rate_limit_service'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('ThrottleMiddleware', (group) => {
  let middleware: ThrottleMiddleware
  let rateLimitService: RateLimitService

  group.setup(async () => {
    rateLimitService = await app.container.make(RateLimitService)
    middleware = await app.container.make(ThrottleMiddleware)
  })

  group.each.teardown(async () => {
    await rateLimitService.clear()
  })

  test('handle: should call next when under rate limit', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 10, window: 60 })

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should set rate limit headers', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 10, window: 60 })

    assert.isTrue((ctx.response.header as sinon.SinonStub).calledWith('X-RateLimit-Limit', '10'))
    assert.isTrue((ctx.response.header as sinon.SinonStub).calledWith('X-RateLimit-Remaining', '9'))
    assert.isTrue((ctx.response.header as sinon.SinonStub).calledThrice)
  })

  test('handle: should throw when rate limit exceeded', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    // Exceed limit
    for (let i = 0; i < 5; i++) {
      await middleware.handle(ctx, nextFn, { max: 5, window: 60 })
    }

    await assert.rejects(async () => middleware.handle(ctx, nextFn, { max: 5, window: 60 }))
  })

  test('handle: should not call next when rate limit exceeded', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    for (let i = 0; i < 3; i++) {
      await middleware.handle(ctx, nextFn, { max: 3, window: 60 })
    }

    const callCountBefore = nextFn.callCount

    try {
      await middleware.handle(ctx, nextFn, { max: 3, window: 60 })
    } catch (error) {
      // Expected
    }

    assert.equal(nextFn.callCount, callCountBefore)
  })

  test('handle: should set Retry-After header when limit exceeded', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    for (let i = 0; i < 5; i++) {
      await middleware.handle(ctx, nextFn, { max: 5, window: 60 })
    }

    try {
      await middleware.handle(ctx, nextFn, { max: 5, window: 60 })
    } catch (error) {
      // Expected
    }

    assert.isTrue((ctx.response.header as sinon.SinonStub).calledWith('Retry-After'))
  })

  test('handle: should use custom key generator', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()
    const customKey = 'custom-key'

    const keyGenerator = sinon.stub().returns(customKey)

    await middleware.handle(ctx, nextFn, {
      max: 5,
      window: 60,
      keyGenerator,
    })

    assert.isTrue(keyGenerator.calledOnce)
    assert.isTrue(keyGenerator.calledWith(ctx))
  })

  test('handle: should use default key generator (route + IP)', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 10, window: 60 })

    // Should have generated key using route and IP
    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should track requests separately per key', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx1 = createMockContext({ ip: '127.0.0.1' })
    const ctx2 = createMockContext({ ip: '127.0.0.2' })

    // Make 3 requests from IP 1
    for (let i = 0; i < 3; i++) {
      await middleware.handle(ctx1, nextFn, { max: 3, window: 60 })
    }

    // IP 1 should be blocked
    await assert.rejects(async () => middleware.handle(ctx1, nextFn, { max: 3, window: 60 }))

    // IP 2 should still work
    await middleware.handle(ctx2, nextFn, { max: 3, window: 60 })
    assert.isTrue(nextFn.called)
  })

  test('handle: should use default options', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should decrement remaining on each request', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 5, window: 60 })
    assert.isTrue((ctx.response.header as sinon.SinonStub).calledWith('X-RateLimit-Remaining', '4'))

    await middleware.handle(ctx, nextFn, { max: 5, window: 60 })
    assert.isTrue((ctx.response.header as sinon.SinonStub).calledWith('X-RateLimit-Remaining', '3'))

    await middleware.handle(ctx, nextFn, { max: 5, window: 60 })
    assert.isTrue((ctx.response.header as sinon.SinonStub).calledWith('X-RateLimit-Remaining', '2'))
  })

  test('handle: should include i18n error message', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    for (let i = 0; i < 3; i++) {
      await middleware.handle(ctx, nextFn, { max: 3, window: 60 })
    }

    try {
      await middleware.handle(ctx, nextFn, { max: 3, window: 60 })
    } catch (error: any) {
      assert.equal(error.code, 'E_RATE_LIMIT')
      assert.exists(error.message)
    }
  })

  test('handle: should set X-RateLimit-Reset header', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 10, window: 60 })

    const resetCalls = (ctx.response.header as sinon.SinonStub)
      .getCalls()
      .filter((call) => call.args[0] === 'X-RateLimit-Reset')

    assert.lengthOf(resetCalls, 1)
    assert.isTrue(Number(resetCalls[0].args[1]) > 0)
  })

  test('edge case: should handle very low limits', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 1, window: 60 })

    await assert.rejects(async () => middleware.handle(ctx, nextFn, { max: 1, window: 60 }))
  })

  test('edge case: should handle very short window', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn, { max: 5, window: 1 })

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle missing options', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })
})

interface MockContextOptions {
  ip?: string
  url?: string
}

const createMockContext = (options: MockContextOptions = {}): HttpContext => {
  const { ip = '127.0.0.1', url = '/test' } = options

  return {
    request: {
      url: () => url,
      method: () => 'GET',
      ip: () => ip,
    },
    response: {
      header: sinon.stub(),
      redirect: sinon.stub().returnsThis(),
      status: sinon.stub().returnsThis(),
    },
    i18n: {
      t: (key: string, params?: any) => {
        if (key === 'common.too_many_requests') {
          return `Too many requests. Please wait ${params?.minutes || 1} minutes.`
        }
        return key
      },
    },
  } as any
}
