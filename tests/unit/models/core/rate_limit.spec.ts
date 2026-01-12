import { test } from '@japa/runner'
import RateLimit from '#core/models/rate_limit'
import { DateTime } from 'luxon'

test.group('RateLimit Model', (group) => {
  group.each.teardown(async () => {
    await RateLimit.query().delete()
  })

  test('should create rate limit entry', async ({ assert }) => {
    const rateLimit = await RateLimit.create({
      key: 'test-key',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    assert.exists(rateLimit.id)
    assert.equal(rateLimit.key, 'test-key')
    assert.equal(rateLimit.hits, 1)
    assert.exists(rateLimit.resetAt)
  })

  test('should have correct structure', async ({ assert }) => {
    const resetAt = DateTime.now().plus({ minutes: 5 })
    const rateLimit = await RateLimit.create({
      key: 'rate:user:123',
      hits: 10,
      resetAt,
    })

    assert.equal(rateLimit.key, 'rate:user:123')
    assert.equal(rateLimit.hits, 10)
    assert.exists(rateLimit.createdAt)
    assert.exists(rateLimit.updatedAt)
    assert.isTrue(rateLimit.resetAt.equals(resetAt))
  })

  test('cleanExpired: should remove expired rate limits', async ({ assert }) => {
    await RateLimit.create({
      key: 'expired-key-1',
      hits: 5,
      resetAt: DateTime.now().minus({ minutes: 10 }),
    })

    await RateLimit.create({
      key: 'expired-key-2',
      hits: 3,
      resetAt: DateTime.now().minus({ minutes: 5 }),
    })

    await RateLimit.create({
      key: 'valid-key',
      hits: 2,
      resetAt: DateTime.now().plus({ minutes: 5 }),
    })

    const deletedCount = await RateLimit.cleanExpired()

    assert.isAtLeast(deletedCount, 2)

    const remaining = await RateLimit.query().where('key', 'valid-key')
    assert.lengthOf(remaining, 1)
  })

  test('cleanExpired: should not remove valid rate limits', async ({ assert }) => {
    await RateLimit.create({
      key: 'valid-key-1',
      hits: 5,
      resetAt: DateTime.now().plus({ minutes: 10 }),
    })

    await RateLimit.create({
      key: 'valid-key-2',
      hits: 3,
      resetAt: DateTime.now().plus({ hours: 1 }),
    })

    const deletedCount = await RateLimit.cleanExpired()

    assert.equal(deletedCount, 0)

    const remaining = await RateLimit.all()
    assert.lengthOf(remaining, 2)
  })

  test('cleanExpired: should return 0 when no expired entries', async ({ assert }) => {
    const deletedCount = await RateLimit.cleanExpired()

    assert.equal(deletedCount, 0)
  })

  test('cleanExpired: should handle boundary case (exactly now)', async ({ assert }) => {
    await RateLimit.create({
      key: 'boundary-key',
      hits: 1,
      resetAt: DateTime.now(),
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    const deletedCount = await RateLimit.cleanExpired()

    assert.isAtLeast(deletedCount, 1)
  })

  test('should update hits counter', async ({ assert }) => {
    const rateLimit = await RateLimit.create({
      key: 'counter-key',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    rateLimit.hits = 5
    await rateLimit.save()

    await rateLimit.refresh()
    assert.equal(rateLimit.hits, 5)
  })

  test('should update resetAt timestamp', async ({ assert }) => {
    const originalResetAt = DateTime.now().plus({ minutes: 1 })
    const rateLimit = await RateLimit.create({
      key: 'time-key',
      hits: 1,
      resetAt: originalResetAt,
    })

    const newResetAt = DateTime.now().plus({ minutes: 10 })
    rateLimit.resetAt = newResetAt
    await rateLimit.save()

    await rateLimit.refresh()
    assert.isFalse(rateLimit.resetAt.equals(originalResetAt))
    assert.isTrue(rateLimit.resetAt.equals(newResetAt))
  })

  test('timestamps: should have createdAt', async ({ assert }) => {
    const rateLimit = await RateLimit.create({
      key: 'test-key',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    assert.exists(rateLimit.createdAt)
    assert.isTrue(rateLimit.createdAt.isValid)
  })

  test('timestamps: should have updatedAt', async ({ assert }) => {
    const rateLimit = await RateLimit.create({
      key: 'test-key',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    assert.exists(rateLimit.updatedAt)
    assert.isTrue(rateLimit.updatedAt.isValid)
  })

  test('timestamps: should update updatedAt on save', async ({ assert }) => {
    const rateLimit = await RateLimit.create({
      key: 'test-key',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    const originalUpdatedAt = rateLimit.updatedAt

    await new Promise((resolve) => setTimeout(resolve, 10))

    rateLimit.hits = 2
    await rateLimit.save()

    await rateLimit.refresh()
    assert.isTrue(rateLimit.updatedAt > originalUpdatedAt)
  })

  test('edge case: very high hits counter', async ({ assert }) => {
    const rateLimit = await RateLimit.create({
      key: 'high-hits-key',
      hits: 999999,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    assert.equal(rateLimit.hits, 999999)
  })

  test('edge case: key with special characters', async ({ assert }) => {
    const specialKey = 'rate:user:123:action:create/update'
    const rateLimit = await RateLimit.create({
      key: specialKey,
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    assert.equal(rateLimit.key, specialKey)
  })

  test('edge case: very long key', async ({ assert }) => {
    const longKey = 'rate:' + 'a'.repeat(200)
    const rateLimit = await RateLimit.create({
      key: longKey,
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    assert.equal(rateLimit.key, longKey)
  })

  test('consistency: multiple rate limits for different keys', async ({ assert }) => {
    await RateLimit.create({
      key: 'key1',
      hits: 5,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    await RateLimit.create({
      key: 'key2',
      hits: 10,
      resetAt: DateTime.now().plus({ minutes: 2 }),
    })

    await RateLimit.create({
      key: 'key3',
      hits: 3,
      resetAt: DateTime.now().plus({ minutes: 3 }),
    })

    const all = await RateLimit.all()
    assert.lengthOf(all, 3)
  })

  test('real-world: IP-based rate limiting', async ({ assert }) => {
    const ip = '192.168.1.1'
    const rateLimit = await RateLimit.create({
      key: `throttle:/api/users:${ip}`,
      hits: 5,
      resetAt: DateTime.now().plus({ seconds: 60 }),
    })

    assert.equal(rateLimit.hits, 5)
    assert.isTrue(rateLimit.resetAt > DateTime.now())
  })

  test('real-world: user-based rate limiting', async ({ assert }) => {
    const userId = 123
    const rateLimit = await RateLimit.create({
      key: `throttle:login:user:${userId}`,
      hits: 3,
      resetAt: DateTime.now().plus({ minutes: 15 }),
    })

    assert.equal(rateLimit.hits, 3)
  })

  test('cleanExpired: should handle large number of expired entries', async ({ assert }) => {
    const entries = []
    for (let i = 0; i < 50; i++) {
      entries.push(
        RateLimit.create({
          key: `expired-key-${i}`,
          hits: 1,
          resetAt: DateTime.now().minus({ minutes: 1 }),
        })
      )
    }
    await Promise.all(entries)

    const deletedCount = await RateLimit.cleanExpired()

    assert.isAtLeast(deletedCount, 50)
  })

  test('cleanExpired: should handle mixed expired and valid entries', async ({ assert }) => {
    await RateLimit.create({
      key: 'expired-1',
      hits: 1,
      resetAt: DateTime.now().minus({ minutes: 5 }),
    })

    await RateLimit.create({
      key: 'valid-1',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 5 }),
    })

    await RateLimit.create({
      key: 'expired-2',
      hits: 1,
      resetAt: DateTime.now().minus({ minutes: 10 }),
    })

    await RateLimit.create({
      key: 'valid-2',
      hits: 1,
      resetAt: DateTime.now().plus({ minutes: 10 }),
    })

    const deletedCount = await RateLimit.cleanExpired()

    assert.isAtLeast(deletedCount, 2)

    const remaining = await RateLimit.all()
    assert.equal(remaining.length, 2)
  })

  test('query: should find by key', async ({ assert }) => {
    await RateLimit.create({
      key: 'find-me',
      hits: 5,
      resetAt: DateTime.now().plus({ minutes: 1 }),
    })

    const found = await RateLimit.findBy('key', 'find-me')

    assert.exists(found)
    assert.equal(found!.key, 'find-me')
    assert.equal(found!.hits, 5)
  })

  test('query: should handle non-existent key', async ({ assert }) => {
    const found = await RateLimit.findBy('key', 'non-existent')

    assert.isNull(found)
  })
})
