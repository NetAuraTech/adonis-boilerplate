import { test } from '@japa/runner'
import RateLimitService from '#core/services/rate_limit_service'
import { DateTime } from 'luxon'
import LogService from '#core/services/log_service'

test.group('RateLimitService', (group) => {
  let rateLimitService: RateLimitService
  let logService: LogService

  group.setup(() => {
    logService = new LogService()
    rateLimitService = new RateLimitService(logService)
  })

  group.each.teardown(async () => {
    await rateLimitService.clear()
  })

  test('attempt: should allow requests within limit', async ({ assert }) => {
    const key = 'test-key-1'
    const result = await rateLimitService.attempt(key, 5, 60)

    assert.isTrue(result.allowed)
    assert.equal(result.remaining, 4)
    assert.isTrue(result.resetAt > DateTime.now())
  })

  test('attempt: should track multiple attempts', async ({ assert }) => {
    const key = 'test-key-2'

    const result1 = await rateLimitService.attempt(key, 3, 60)
    assert.equal(result1.remaining, 2)

    const result2 = await rateLimitService.attempt(key, 3, 60)
    assert.equal(result2.remaining, 1)

    const result3 = await rateLimitService.attempt(key, 3, 60)
    assert.equal(result3.remaining, 0)
  })

  test('attempt: should deny requests exceeding limit', async ({ assert }) => {
    const key = 'test-key-3'

    for (let i = 0; i < 3; i++) {
      await rateLimitService.attempt(key, 3, 60)
    }

    const result = await rateLimitService.attempt(key, 3, 60)

    assert.isFalse(result.allowed)
    assert.equal(result.remaining, 0)
    assert.exists(result.retryAfter)
  })

  test('attempt: should provide retry after time', async ({ assert }) => {
    const key = 'test-key-4'

    for (let i = 0; i < 5; i++) {
      await rateLimitService.attempt(key, 5, 60)
    }

    const result = await rateLimitService.attempt(key, 5, 60)

    assert.isFalse(result.allowed)
    assert.exists(result.retryAfter)
    assert.isTrue(result.retryAfter! > 0)
    assert.isTrue(result.retryAfter! <= 60)
  })

  test('reset: should reset rate limit for key', async ({ assert }) => {
    const key = 'test-key-5'

    await rateLimitService.attempt(key, 3, 60)
    await rateLimitService.attempt(key, 3, 60)

    await rateLimitService.reset(key)

    const result = await rateLimitService.attempt(key, 3, 60)
    assert.equal(result.remaining, 2)
  })

  test('remaining: should return correct remaining attempts', async ({ assert }) => {
    const key = 'test-key-6'

    await rateLimitService.attempt(key, 5, 60)
    await rateLimitService.attempt(key, 5, 60)

    const remaining = await rateLimitService.remaining(key, 5)
    assert.equal(remaining, 3)
  })

  test('remaining: should return max attempts for new key', async ({ assert }) => {
    const remaining = await rateLimitService.remaining('new-key', 10)
    assert.equal(remaining, 10)
  })

  test('clear: should clear all rate limits', async ({ assert }) => {
    await rateLimitService.attempt('key1', 5, 60)
    await rateLimitService.attempt('key2', 5, 60)

    await rateLimitService.clear()

    const remaining1 = await rateLimitService.remaining('key1', 5)
    const remaining2 = await rateLimitService.remaining('key2', 5)

    assert.equal(remaining1, 5)
    assert.equal(remaining2, 5)
  })

  test('attempt: should handle different keys independently', async ({ assert }) => {
    const key1 = 'user1-login'
    const key2 = 'user2-login'

    await rateLimitService.attempt(key1, 3, 60)
    await rateLimitService.attempt(key1, 3, 60)
    await rateLimitService.attempt(key1, 3, 60)

    const result1 = await rateLimitService.attempt(key1, 3, 60)
    const result2 = await rateLimitService.attempt(key2, 3, 60)

    assert.isFalse(result1.allowed)
    assert.isTrue(result2.allowed)
  })
})
