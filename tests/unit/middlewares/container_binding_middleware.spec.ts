import { test } from '@japa/runner'
import ContainerBindingsMiddleware from '#core/middleware/container_bindings_middleware'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

test.group('ContainerBindingsMiddleware', (group) => {
  let middleware: ContainerBindingsMiddleware

  group.setup(async () => {
    middleware = await app.container.make(ContainerBindingsMiddleware)
  })

  test('handle: should call next', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should bind HttpContext to container', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    assert.isTrue(
      (ctx.containerResolver.bindValue as sinon.SinonStub).calledWith(sinon.match.any, ctx)
    )
  })

  test('handle: should bind Logger to container', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    assert.isTrue(
      (ctx.containerResolver.bindValue as sinon.SinonStub).calledWith(sinon.match.any, ctx.logger)
    )
  })

  test('handle: should bind both HttpContext and Logger', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    assert.isTrue((ctx.containerResolver.bindValue as sinon.SinonStub).calledTwice)
  })

  test('handle: should bind values before calling next', async () => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    // bindValue should be called before next
    sinon.assert.callOrder(ctx.containerResolver.bindValue as sinon.SinonStub, nextFn)
  })

  test('consistency: multiple calls should bind each time', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)
    await middleware.handle(ctx, nextFn)
    await middleware.handle(ctx, nextFn)

    assert.equal((ctx.containerResolver.bindValue as sinon.SinonStub).callCount, 6)
    assert.equal(nextFn.callCount, 3)
  })

  test('edge case: containerResolver is required', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx: any = {
      logger: {},
    }

    // ContainerResolver is always present in real AdonisJS requests
    // This test verifies the middleware expects it
    await assert.rejects(async () => middleware.handle(ctx, nextFn))
  })

  test('real-world: enables dependency injection in controllers', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext()

    await middleware.handle(ctx, nextFn)

    // After this middleware, controllers can inject HttpContext and Logger
    assert.isTrue((ctx.containerResolver.bindValue as sinon.SinonStub).called)
    assert.isTrue(nextFn.calledOnce)
  })
})

const createMockContext = (): HttpContext => {
  return {
    containerResolver: {
      bindValue: sinon.stub(),
    },
    logger: {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
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
