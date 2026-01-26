import { test } from '@japa/runner'
import { isRedisAvailable, resetRedisCheck } from '#core/helpers/redis'

test.group('Core Helpers / Redis', (group) => {
  group.each.setup(() => {
    resetRedisCheck()
  })

  test('isRedisAvailable: should return a boolean', async ({ assert }) => {
    const available = await isRedisAvailable()
    assert.isBoolean(available)
  })
})
