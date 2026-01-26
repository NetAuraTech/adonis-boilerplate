import { test } from '@japa/runner'
import NotificationService from '#notification/services/notification_service'
import { UserFactory, UserPreferenceFactory, NotificationFactory } from '#tests/helpers/factories'
import transmit from '@adonisjs/transmit/services/main'
import sinon from 'sinon'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'

test.group('NotificationService', (group) => {
  let service: NotificationService
  let broadcastStub: sinon.SinonStub

  group.each.setup(async () => {
    service = await app.container.make(NotificationService)
    broadcastStub = sinon.stub(transmit, 'broadcast')
  })

  group.each.teardown(() => {
    broadcastStub.restore()
  })

  test('create: should create notification if in-app is enabled', async ({ assert }) => {
    const user = await UserFactory.create()
    await UserPreferenceFactory.create({
      userId: user.id,
      preferences: {
        notifications: {
          inApp: { test: true },
          email: {},
          emailFrequency: 'immediate',
        },
      },
    })

    const notification = await service.create({
      userId: user.id,
      type: 'test',
      title: 'Hello',
      message: 'World',
    })

    assert.isNotNull(notification)
    assert.equal(notification!.title, 'Hello')
    assert.isTrue(broadcastStub.calledOnce)
  })

  test('create: should not create notification if in-app is disabled', async ({ assert }) => {
    const user = await UserFactory.create()
    await UserPreferenceFactory.create({
      userId: user.id,
      preferences: {
        notifications: {
          inApp: { test: false },
          email: {},
          emailFrequency: 'immediate',
        },
      },
    })

    const notification = await service.create({
      userId: user.id,
      type: 'test',
      title: 'Hello',
      message: 'World',
    })

    assert.isNull(notification)
    assert.isFalse(broadcastStub.called)
  })

  test('getUnreadCount: should return correct count', async ({ assert }) => {
    const user = await UserFactory.create()
    await NotificationFactory.create({ userId: user.id, readAt: null })
    await NotificationFactory.create({ userId: user.id, readAt: null })
    await NotificationFactory.create({
      userId: user.id,
      readAt: DateTime.now().minus({ minutes: 5 }),
    })

    const count = await service.getUnreadCount(user.id)
    assert.equal(count, 2)
  })

  test('markAsRead: should mark notification as read for the user', async ({ assert }) => {
    const user = await UserFactory.create()
    const notification = await NotificationFactory.create({ userId: user.id, readAt: null })

    const updated = await service.markAsRead(notification.id, user.id)
    assert.isNotNull(updated)
    assert.isTrue(updated!.isRead)
  })
})
