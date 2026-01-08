import { test } from '@japa/runner'
import AuthService from '#auth/services/auth_service'
import { UserFactory } from '#tests/helpers/factories'
import User from '#auth/models/user'

test.group('AuthService', (group) => {
  let authService: AuthService

  group.setup(() => {
    authService = new AuthService()
  })

  test('login: should authenticate user with valid credentials', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      password: 'password123',
    })

    const authenticatedUser = await authService.login('test@example.com', 'password123')

    assert.instanceOf(authenticatedUser, User)
    assert.equal(authenticatedUser.id, user.id)
    assert.equal(authenticatedUser.email, 'test@example.com')
  })

  test('login: should throw exception with invalid credentials', async ({ assert }) => {
    await UserFactory.create({
      email: 'test@example.com',
      password: 'password123',
    })

    await assert.rejects(
      async () => authService.login('test@example.com', 'wrongpassword'),
      'Invalid credentials'
    )
  })

  test('login: should throw exception with non-existent email', async ({ assert }) => {
    await assert.rejects(
      async () => authService.login('nonexistent@example.com', 'password123'),
      'Invalid credentials'
    )
  })

  test('register: should create a new user with user role', async ({ assert }) => {
    const user = await authService.register({
      email: 'newuser@example.com',
      password: 'password123',
    })

    assert.instanceOf(user, User)
    assert.equal(user.email, 'newuser@example.com')
    assert.exists(user.password)
    assert.exists(user.roleId)

    const role = await user.related('role').query().first()
    assert.equal(role?.slug, 'user')
  })

  test('register: should throw exception if email already exists', async ({ assert }) => {
    await UserFactory.create({ email: 'existing@example.com' })

    await assert.rejects(
      async () =>
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
        }),
      'Email already exists'
    )
  })

  test('register: should hash password before storing', async ({ assert }) => {
    const user = await authService.register({
      email: 'newuser@example.com',
      password: 'password123',
    })

    assert.notEqual(user.password, 'password123')
    assert.isTrue(user.password!.length > 20) // Hashed password is longer
  })

  test('logout: should log user logout', async ({ assert }) => {
    const user = await UserFactory.create()

    // Should not throw
    await assert.doesNotReject(async () => authService.logout(user.id))
  })
})
