import { test } from '@japa/runner'
import AuthValidators from '#auth/validators/auth_validators'

test.group('AuthValidators', () => {
  test('login: should validate correct data', async ({ assert }) => {
    const validator = AuthValidators.login()
    const data = {
      email: 'test@example.com',
      password: 'password123',
      remember_me: true,
    }

    const result = await validator.validate(data)

    assert.equal(result.email, 'test@example.com')
    assert.equal(result.password, 'password123')
    assert.isTrue(result.remember_me)
  })

  test('login: should normalize email to lowercase', async ({ assert }) => {
    const validator = AuthValidators.login()
    const data = {
      email: '  TEST@EXAMPLE.COM  ',
      password: 'password123',
    }

    const result = await validator.validate(data)

    assert.equal(result.email, 'test@example.com')
  })

  test('login: should reject invalid email format', async ({ assert }) => {
    const validator = AuthValidators.login()
    const data = {
      email: 'invalid-email',
      password: 'password123',
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('login: should reject missing password', async ({ assert }) => {
    const validator = AuthValidators.login()
    const data = {
      email: 'test@example.com',
    }

    await assert.rejects(async () => validator.validate(data as any))
  })

  test('login: remember_me is optional', async ({ assert }) => {
    const validator = AuthValidators.login()
    const data = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = await validator.validate(data)

    assert.isUndefined(result.remember_me)
  })

  test('forgotPassword: should validate correct email', async ({ assert }) => {
    const validator = AuthValidators.forgotPassword()
    const data = {
      email: '  Forgot@Example.com  ',
    }

    const result = await validator.validate(data)

    assert.equal(result.email, 'forgot@example.com')
  })

  test('forgotPassword: should reject invalid email', async ({ assert }) => {
    const validator = AuthValidators.forgotPassword()
    const data = {
      email: 'not-an-email',
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('resetPassword: should validate token and confirmed password', async ({ assert }) => {
    const validator = AuthValidators.resetPassword()
    const data = {
      token: 'valid-token-123',
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    }

    const result = await validator.validate(data)

    assert.equal(result.token, 'valid-token-123')
    assert.equal(result.password, 'newpassword123')
  })

  test('resetPassword: should reject password shorter than 8 chars', async ({ assert }) => {
    const validator = AuthValidators.resetPassword()
    const data = {
      token: 'valid-token',
      password: 'short',
      password_confirmation: 'short',
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('resetPassword: should reject mismatched password confirmation', async ({ assert }) => {
    const validator = AuthValidators.resetPassword()
    const data = {
      token: 'valid-token',
      password: 'newpassword123',
      password_confirmation: 'differentpassword',
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('acceptInvitation: should validate all fields', async ({ assert }) => {
    const validator = AuthValidators.acceptInvitation()
    const data = {
      token: 'invitation-token',
      full_name: 'John Doe',
      password: 'securepass123',
      password_confirmation: 'securepass123',
    }

    const result = await validator.validate(data)

    assert.equal(result.token, 'invitation-token')
    assert.equal(result.full_name, 'John Doe')
    assert.equal(result.password, 'securepass123')
  })

  test('acceptInvitation: full_name is optional', async ({ assert }) => {
    const validator = AuthValidators.acceptInvitation()
    const data = {
      token: 'invitation-token',
      password: 'securepass123',
      password_confirmation: 'securepass123',
    }

    const result = await validator.validate(data)

    assert.isUndefined(result.full_name)
  })

  test('acceptInvitation: should reject short full_name', async ({ assert }) => {
    const validator = AuthValidators.acceptInvitation()
    const data = {
      token: 'invitation-token',
      full_name: 'A',
      password: 'securepass123',
      password_confirmation: 'securepass123',
    }

    await assert.rejects(async () => validator.validate(data))
  })

  test('definePassword: should validate confirmed password', async ({ assert }) => {
    const validator = AuthValidators.definePassword()
    const data = {
      password: 'mypassword123',
      password_confirmation: 'mypassword123',
    }

    const result = await validator.validate(data)

    assert.equal(result.password, 'mypassword123')
  })

  test('definePassword: should reject short password', async ({ assert }) => {
    const validator = AuthValidators.definePassword()
    const data = {
      password: 'short',
      password_confirmation: 'short',
    }

    await assert.rejects(async () => validator.validate(data))
  })
})
