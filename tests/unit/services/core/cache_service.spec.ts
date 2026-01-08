import { test } from '@japa/runner'
import CacheService from '#core/services/cache_service'
import { sleep } from '#core/helpers/sleep'

test.group('CacheService', (group) => {
  let cacheService: CacheService

  group.setup(() => {
    cacheService = new CacheService()
  })

  group.each.teardown(async () => {
    await cacheService.flush()
  })

  test('set and get: should store and retrieve value', async ({ assert }) => {
    await cacheService.set('test-key', 'test-value')

    const value = await cacheService.get('test-key')
    assert.equal(value, 'test-value')
  })

  test('set and get: should handle complex objects', async ({ assert }) => {
    const obj = {
      name: 'John',
      age: 30,
      hobbies: ['coding', 'reading'],
      nested: { key: 'value' },
    }

    await cacheService.set('object-key', obj)

    const value = await cacheService.get('object-key')
    assert.deepEqual(value, obj)
  })

  test('get: should return null for non-existent key', async ({ assert }) => {
    const value = await cacheService.get('non-existent-key')
    assert.isNull(value)
  })

  test('set with TTL: should expire after TTL', async ({ assert }) => {
    await cacheService.set('expiring-key', 'value', 1) // 1 second TTL

    const value1 = await cacheService.get('expiring-key')
    assert.equal(value1, 'value')

    await sleep(1500) // Wait 1.5 seconds

    const value2 = await cacheService.get('expiring-key')
    assert.isNull(value2)
  })

  test('delete: should remove value', async ({ assert }) => {
    await cacheService.set('delete-key', 'value')

    await cacheService.delete('delete-key')

    const value = await cacheService.get('delete-key')
    assert.isNull(value)
  })

  test('has: should return true for existing key', async ({ assert }) => {
    await cacheService.set('exists-key', 'value')

    const exists = await cacheService.has('exists-key')
    assert.isTrue(exists)
  })

  test('has: should return false for non-existent key', async ({ assert }) => {
    const exists = await cacheService.has('non-existent-key')
    assert.isFalse(exists)
  })

  test('has: should return false for expired key', async ({ assert }) => {
    await cacheService.set('expiring-key', 'value', 1)

    await sleep(1500)

    const exists = await cacheService.has('expiring-key')
    assert.isFalse(exists)
  })

  test('increment: should increment numeric value', async ({ assert }) => {
    await cacheService.set('counter', 5)

    const value = await cacheService.increment('counter', 3)
    assert.equal(value, 8)

    const storedValue = await cacheService.get('counter')
    assert.equal(storedValue, 8)
  })

  test('increment: should start from 0 for new key', async ({ assert }) => {
    const value = await cacheService.increment('new-counter', 5)
    assert.equal(value, 5)
  })

  test('decrement: should decrement numeric value', async ({ assert }) => {
    await cacheService.set('counter', 10)

    const value = await cacheService.decrement('counter', 3)
    assert.equal(value, 7)

    const storedValue = await cacheService.get('counter')
    assert.equal(storedValue, 7)
  })

  test('decrement: should handle negative results', async ({ assert }) => {
    await cacheService.set('counter', 5)

    const value = await cacheService.decrement('counter', 10)
    assert.equal(value, -5)
  })

  test('flush: should clear all cache', async ({ assert }) => {
    await cacheService.set('key1', 'value1')
    await cacheService.set('key2', 'value2')
    await cacheService.set('key3', 'value3')

    await cacheService.flush()

    const value1 = await cacheService.get('key1')
    const value2 = await cacheService.get('key2')
    const value3 = await cacheService.get('key3')

    assert.isNull(value1)
    assert.isNull(value2)
    assert.isNull(value3)
  })

  test('getMany: should retrieve multiple values', async ({ assert }) => {
    await cacheService.set('key1', 'value1')
    await cacheService.set('key2', 'value2')
    await cacheService.set('key3', 'value3')

    const values = await cacheService.getMany(['key1', 'key2', 'key4'])

    assert.equal(values.get('key1'), 'value1')
    assert.equal(values.get('key2'), 'value2')
    assert.isNull(values.get('key4'))
  })

  test('setMany: should store multiple values', async ({ assert }) => {
    const entries = new Map<string, any>([
      ['key1', 'value1'],
      ['key2', { nested: 'object' }],
      ['key3', 123],
    ])

    await cacheService.setMany(entries)

    const value1 = await cacheService.get('key1')
    const value2 = await cacheService.get('key2')
    const value3 = await cacheService.get('key3')

    assert.equal(value1, 'value1')
    assert.deepEqual(value2, { nested: 'object' })
    assert.equal(value3, 123)
  })

  test('setMany with TTL: should set TTL for all entries', async ({ assert }) => {
    const entries = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])

    await cacheService.setMany(entries, 1)

    await sleep(1500)

    const value1 = await cacheService.get('key1')
    const value2 = await cacheService.get('key2')

    assert.isNull(value1)
    assert.isNull(value2)
  })

  test('concurrent operations: should handle multiple simultaneous operations', async ({
    assert,
  }) => {
    const operations = []

    for (let i = 0; i < 10; i++) {
      operations.push(cacheService.set(`key-${i}`, `value-${i}`))
    }

    await Promise.all(operations)

    const value5 = await cacheService.get('key-5')
    assert.equal(value5, 'value-5')
  })

  test('large values: should handle large data', async ({ assert }) => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: 'x'.repeat(100),
    }))

    await cacheService.set('large-data', largeArray)

    const retrieved = await cacheService.get('large-data')
    assert.lengthOf(retrieved, 1000)
    assert.equal(retrieved[0].name, 'Item 0')
  })

  test('special characters in keys: should handle special characters', async ({ assert }) => {
    const specialKeys = [
      'key:with:colons',
      'key-with-dashes',
      'key_with_underscores',
      'key.with.dots',
    ]

    for (const key of specialKeys) {
      await cacheService.set(key, `value-${key}`)
    }

    for (const key of specialKeys) {
      const value = await cacheService.get(key)
      assert.equal(value, `value-${key}`)
    }
  })

  test('null and undefined values: should handle null', async ({ assert }) => {
    await cacheService.set('null-key', null)
    await cacheService.set('undefined-key', undefined)

    const nullValue = await cacheService.get('null-key')
    assert.isNull(nullValue)
  })

  test('boolean values: should handle boolean values', async ({ assert }) => {
    await cacheService.set('true-key', true)
    await cacheService.set('false-key', false)

    const trueValue = await cacheService.get('true-key')
    const falseValue = await cacheService.get('false-key')

    assert.isTrue(trueValue)
    assert.isFalse(falseValue)
  })
})
