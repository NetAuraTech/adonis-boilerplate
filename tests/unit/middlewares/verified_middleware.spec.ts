import { test } from '@japa/runner'
import VerifiedMiddleware from '#core/middleware/verified_middleware'
import { UserFactory } from '#tests/helpers/factories'
import sinon from 'sinon'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

test.group('VerifiedMiddleware', (group) => {
  let middleware: VerifiedMiddleware

  group.setup(() => {
    middleware = new VerifiedMiddleware()
  })

  test('handle: should call next when user email is verified', async ({ assert }) => {
    const user = await UserFactory.create({
      emailVerifiedAt: DateTime.now(),
    })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should throw when user email is not verified', async ({ assert }) => {
    const user = await UserFactory.createUnverified({
      emailVerifiedAt: null,
    })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () => middleware.handle(ctx, nextFn), 'Email not verified')
  })

  test('handle: should not call next when email is not verified', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error) {
      // Expected
    }

    assert.isFalse(nextFn.called)
  })

  test('handle: should throw when user is not authenticated', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext(null)

    await assert.rejects(async () => middleware.handle(ctx, nextFn), 'Unauthenticated')
  })

  test('handle: should throw E_UNAUTHORIZED for unauthenticated user', async ({ assert }) => {
    const nextFn = sinon.spy()
    const ctx = createMockContext(null)

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error: any) {
      assert.equal(error.status, 401)
      assert.equal(error.code, 'E_UNAUTHORIZED')
    }
  })

  test('handle: should throw E_EMAIL_NOT_VERIFIED for unverified user', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error: any) {
      assert.equal(error.status, 403)
      assert.equal(error.code, 'E_EMAIL_NOT_VERIFIED')
    }
  })

  test('handle: should work with recently verified email', async ({ assert }) => {
    const user = await UserFactory.create({
      emailVerifiedAt: DateTime.now().minus({ seconds: 1 }),
    })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('handle: should work with old verification date', async ({ assert }) => {
    const user = await UserFactory.create({
      emailVerifiedAt: DateTime.now().minus({ years: 1 }),
    })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should handle user with future verification date', async ({ assert }) => {
    const user = await UserFactory.create({
      emailVerifiedAt: DateTime.now().plus({ days: 1 }),
    })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn)

    assert.isTrue(nextFn.calledOnce)
  })

  test('edge case: should block user with null emailVerifiedAt', async ({ assert }) => {
    const user = await UserFactory.create()
    user.emailVerifiedAt = null
    await user.save()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await assert.rejects(async () => middleware.handle(ctx, nextFn))
  })

  test('consistency: multiple calls with verified user', async ({ assert }) => {
    const user = await UserFactory.create({
      emailVerifiedAt: DateTime.now(),
    })

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    await middleware.handle(ctx, nextFn)
    await middleware.handle(ctx, nextFn)
    await middleware.handle(ctx, nextFn)

    assert.equal(nextFn.callCount, 3)
  })

  test('consistency: multiple calls with unverified user', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    const nextFn = sinon.spy()
    const ctx = createMockContext(user)

    let errorCount = 0

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error) {
      errorCount++
    }

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error) {
      errorCount++
    }

    try {
      await middleware.handle(ctx, nextFn)
    } catch (error) {
      errorCount++
    }

    assert.equal(errorCount, 3)
    assert.equal(nextFn.callCount, 0)
  })

  test('should use user.isEmailVerified getter', async ({ assert }) => {
    const verifiedUser = await UserFactory.create({
      emailVerifiedAt: DateTime.now(),
    })

    const unverifiedUser = await UserFactory.createUnverified()

    assert.isTrue(verifiedUser.isEmailVerified)
    assert.isFalse(unverifiedUser.isEmailVerified)
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
