import { test } from '@japa/runner'
import sinon from 'sinon'
import {
  OAUTH_PROVIDERS,
  getEnabledProviders,
  isProviderActive,
  getProviderConfig,
  OAuthProviderName,
} from '#auth/helpers/oauth'

test.group('OAuth Helpers', (group) => {
  group.each.teardown(() => {
    sinon.restore()
  })

  test('getEnabledProviders: should return only enabled providers', async ({ assert }) => {
    const enabledProviders = getEnabledProviders()

    enabledProviders.forEach((provider) => {
      assert.isTrue(provider.enabled)
    })
  })

  test('getEnabledProviders: should return provider configs with required fields', async ({
    assert,
  }) => {
    const enabledProviders = getEnabledProviders()

    enabledProviders.forEach((provider) => {
      assert.property(provider, 'name')
      assert.property(provider, 'icon')
      assert.property(provider, 'color')
      assert.property(provider, 'enabled')
    })
  })

  test('isProviderActive: should return true for enabled provider', async ({ assert }) => {
    const providerNames: OAuthProviderName[] = ['github', 'google', 'facebook']

    providerNames.forEach((name) => {
      const expectedEnabled = OAUTH_PROVIDERS[name].enabled
      const result = isProviderActive(name)
      assert.equal(result, expectedEnabled)
    })
  })

  test('isProviderActive: should return false for invalid provider', async ({ assert }) => {
    const result = isProviderActive('invalid' as OAuthProviderName)

    assert.isFalse(result)
  })

  test('getProviderConfig: should return config for valid provider', async ({ assert }) => {
    const config = getProviderConfig('github')

    assert.isNotNull(config)
    assert.equal(config?.name, 'GitHub')
    assert.property(config, 'icon')
    assert.property(config, 'color')
  })

  test('getProviderConfig: should return null for invalid provider', async ({ assert }) => {
    const config = getProviderConfig('invalid' as OAuthProviderName)

    assert.isNull(config)
  })

  test('OAUTH_PROVIDERS: should have correct structure for github', async ({ assert }) => {
    const github = OAUTH_PROVIDERS.github

    assert.equal(github.name, 'GitHub')
    assert.equal(github.color, '#333')
    assert.isString(github.icon)
    assert.isBoolean(github.enabled)
  })

  test('OAUTH_PROVIDERS: should have correct structure for google', async ({ assert }) => {
    const google = OAUTH_PROVIDERS.google

    assert.equal(google.name, 'Google')
    assert.equal(google.color, '#4285F4')
    assert.isString(google.icon)
    assert.isBoolean(google.enabled)
  })

  test('OAUTH_PROVIDERS: should have correct structure for facebook', async ({ assert }) => {
    const facebook = OAUTH_PROVIDERS.facebook

    assert.equal(facebook.name, 'Facebook')
    assert.equal(facebook.color, '#1877F2')
    assert.isString(facebook.icon)
    assert.isBoolean(facebook.enabled)
  })
})
