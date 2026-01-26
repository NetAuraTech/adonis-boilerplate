import { test } from '@japa/runner'
import { UserPreferenceFactory } from '#tests/helpers/factories'

test.group('UserPreference Model', () => {
  test('get: should return default values from getters when preferences are empty', async ({
    assert,
  }) => {
    const up = await UserPreferenceFactory.create({ preferences: {} })

    assert.equal(up.interface.theme, 'light')
    assert.equal(up.privacy.profileVisibility, 'public')
    assert.equal(up.notifications.emailFrequency, 'immediate')
  })

  test('get: should return specific preference by dot path', async ({ assert }) => {
    const up = await UserPreferenceFactory.create({
      preferences: {
        interface: { theme: 'dark', density: 'comfortable' },
        custom: { setting: true },
      },
    })

    assert.equal(up.get('interface.theme'), 'dark')
    assert.isTrue(up.get('custom.setting'))
    assert.equal(up.get('non.existent', 'default'), 'default')
  })

  test('set: should set specific preference by dot path', async ({ assert }) => {
    const up = await UserPreferenceFactory.create({ preferences: {} })

    up.set('notifications.email.news', false)
    up.set('theme', 'dark')

    assert.isFalse(up.get('notifications.email.news'))
    assert.equal(up.get('theme'), 'dark')

    await up.save()
    await up.refresh()

    assert.isFalse(up.get('notifications.email.news'))
  })
})
