import { test } from '@japa/runner'
import NotificationValidators from '#notification/validators/notification_validators'

test.group('NotificationValidators', () => {
  test('list: should validate search filters', async ({ assert }) => {
    const validator = NotificationValidators.list()
    const data = {
      page: 1,
      limit: 20,
      unread_only: true,
      type: 'alert',
    }

    const result = await validator.validate(data)
    assert.equal(result.page, 1)
    assert.isTrue(result.unread_only)
    assert.equal(result.type, 'alert')
  })

  test('markAsRead: should validate numeric id', async ({ assert }) => {
    const validator = NotificationValidators.markAsRead()
    const data = { id: 123 }

    const result = await validator.validate(data)
    assert.equal(result.id, 123)
  })

  test('delete: should reject invalid id', async ({ assert }) => {
    const validator = NotificationValidators.delete()
    const data = { id: -5 }

    await assert.rejects(async () => validator.validate(data))
  })
})
