import { test } from '@japa/runner'
import { NotificationFactory } from '#tests/helpers/factories'
import { DateTime } from 'luxon'

test.group('Notification Model', () => {
  test('isRead: should return true when readAt is set', async ({ assert }) => {
    const notification = await NotificationFactory.create({
      readAt: DateTime.now(),
    })
    assert.isTrue(notification.isRead)
  })

  test('isRead: should return false when readAt is null', async ({ assert }) => {
    const notification = await NotificationFactory.create({
      readAt: null,
    })
    assert.isFalse(notification.isRead)
  })

  test('markAsRead: should set readAt if currently unread', async ({ assert }) => {
    const notification = await NotificationFactory.create({ readAt: null })
    await notification.markAsRead()
    assert.isNotNull(notification.readAt)
    assert.isTrue(notification.isRead)
  })

  test('markAsUnread: should clear readAt if currently read', async ({ assert }) => {
    const notification = await NotificationFactory.create({ readAt: DateTime.now() })
    await notification.markAsUnread()
    assert.isNull(notification.readAt)
    assert.isFalse(notification.isRead)
  })
})
