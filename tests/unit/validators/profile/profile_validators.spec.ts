import { test } from '@japa/runner'
import ProfileValidators from '#profile/validators/profile_validators'
import UserPreferenceValidators from '#profile/validators/user_preference_validators'

test.group('Profile Module / ProfileValidators', () => {
  test('updateProfile: should validate correct data', async ({ assert }) => {
    const validator = ProfileValidators.updateProfile(1)
    const data = {
      fullName: 'John Doe',
      email: 'john@example.com',
      locale: 'en',
    }

    const result = await validator.validate(data)
    assert.equal(result.fullName, 'John Doe')
    assert.equal(result.email, 'john@example.com')
  })

  test('updatePassword: should validate confirmed password', async ({ assert }) => {
    const validator = ProfileValidators.updatePassword()
    const data = {
      current_password: 'old-password',
      password: 'new-password',
      password_confirmation: 'new-password',
    }

    const result = await validator.validate(data)
    assert.equal(result.password, 'new-password')
  })
})

test.group('Profile Module / UserPreferenceValidators', () => {
  test('update: should validate nested preferences', async ({ assert }) => {
    const validator = UserPreferenceValidators.update()
    const data = {
      interface: { theme: 'dark' },
      privacy: { showEmail: true },
    }

    const result = await validator.validate(data)
    assert.equal(result.interface?.theme, 'dark')
    assert.isTrue(result.privacy?.showEmail)
  })

  test('setPreference: should validate path and value', async ({ assert }) => {
    const validator = UserPreferenceValidators.setPreference()
    const data = {
      path: 'notifications.email.security',
      value: false,
    }

    const result = await validator.validate(data)
    assert.equal(result.path, 'notifications.email.security')
    assert.isFalse(result.value)
  })
})
