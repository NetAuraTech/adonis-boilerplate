import { test } from '@japa/runner'
import { UserPresenter } from '#auth/presenters/user_presenter'
import { UserFactory, RoleFactory, PermissionFactory } from '#tests/helpers/factories'
import { DateTime } from 'luxon'

test.group('UserPresenter', () => {
  test('toJSON: should return null for null user', async ({ assert }) => {
    const result = await UserPresenter.toJSON(null)

    assert.isNull(result)
  })

  test('toJSON: should return null for undefined user', async ({ assert }) => {
    const result = await UserPresenter.toJSON(undefined)

    assert.isNull(result)
  })

  test('toJSON: should format user with all properties', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Test User',
      locale: 'fr',
      emailVerifiedAt: DateTime.now(),
      githubId: 'github-123',
      googleId: 'google-456',
      facebookId: 'facebook-789',
    })

    const result = await UserPresenter.toJSON(user)

    assert.exists(result)
    assert.equal(result!.id, user.id)
    assert.equal(result!.email, 'test@example.com')
    assert.equal(result!.fullName, 'Test User')
    assert.equal(result!.locale, 'fr')
    assert.exists(result!.emailVerifiedAt)
    assert.equal(result!.githubId, 'github-123')
    assert.equal(result!.googleId, 'google-456')
    assert.equal(result!.facebookId, 'facebook-789')
    assert.exists(result!.createdAt)
  })

  test('toJSON: should include role with permissions', async ({ assert }) => {
    const perm1 = await PermissionFactory.create({
      slug: 'users.create',
      category: 'users',
    })
    const perm2 = await PermissionFactory.create({
      slug: 'users.delete',
      category: 'users',
    })
    const role = await RoleFactory.create({ name: 'Admin' })
    await role.related('permissions').attach([perm1.id, perm2.id])

    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const result = await UserPresenter.toJSON(user)

    assert.exists(result!.role)
    assert.equal(result!.role!.name, 'Admin')
    assert.lengthOf(result!.role!.permissions, 2)
    assert.equal(result!.role!.permissions[0].slug, 'users.create')
    assert.equal(result!.role!.permissions[1].slug, 'users.delete')
  })

  test('toJSON: should handle user without role', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    const result = await UserPresenter.toJSON(user)

    assert.isNull(result!.role)
  })

  test('toJSON: should preload role if not already loaded', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'User', slug: 'user' })
    const user = await UserFactory.create({ roleId: role.id })

    const result = await UserPresenter.toJSON(user)

    assert.exists(result!.role)
    assert.equal(result!.role!.name, 'User')
  })

  test('toJSON: should include pendingEmail', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })

    const result = await UserPresenter.toJSON(user)

    assert.equal(result!.pendingEmail, 'new@example.com')
  })

  test('toJSON: should handle null emailVerifiedAt', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    const result = await UserPresenter.toJSON(user)

    assert.isNull(result!.emailVerifiedAt)
  })

  test('toJSON: should handle null fullName', async ({ assert }) => {
    const user = await UserFactory.create({ fullName: null })

    const result = await UserPresenter.toJSON(user)

    assert.isNull(result!.fullName)
  })

  test('toJSON: should format createdAt and updatedAt as ISO', async ({ assert }) => {
    const user = await UserFactory.create()

    const result = await UserPresenter.toJSON(user)

    assert.isString(result!.createdAt)
    assert.match(result!.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('toPublicJSON: should return null for null user', async ({ assert }) => {
    const result = await UserPresenter.toPublicJSON(null)

    assert.isNull(result)
  })

  test('toPublicJSON: should exclude OAuth IDs', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      githubId: 'github-123',
      googleId: 'google-456',
      facebookId: 'facebook-789',
    })

    const result = await UserPresenter.toPublicJSON(user)

    assert.exists(result)
    assert.equal(result!.email, 'test@example.com')
    assert.notProperty(result!, 'githubId')
    assert.notProperty(result!, 'googleId')
    assert.notProperty(result!, 'facebookId')
  })

  test('toPublicJSON: should include all other properties', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Test User',
      locale: 'en',
      emailVerifiedAt: DateTime.now(),
    })

    const result = await UserPresenter.toPublicJSON(user)

    assert.exists(result!.id)
    assert.exists(result!.email)
    assert.exists(result!.fullName)
    assert.exists(result!.locale)
    assert.exists(result!.emailVerifiedAt)
    assert.exists(result!.createdAt)
  })

  test('toPublicJSON: should include role with permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    const role = await RoleFactory.create({ name: 'Admin' })
    await role.related('permissions').attach([permission.id])

    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const result = await UserPresenter.toPublicJSON(user)

    assert.exists(result!.role)
    assert.equal(result!.role!.name, 'Admin')
    assert.isAtLeast(result!.role!.permissions.length, 1)
  })

  test('hasLinkedProviders: should return true when user has github', async ({ assert }) => {
    const user = await UserFactory.create({ githubId: 'github-123' })

    const result = UserPresenter.hasLinkedProviders(user)

    assert.isTrue(result)
  })

  test('hasLinkedProviders: should return true when user has google', async ({ assert }) => {
    const user = await UserFactory.create({ googleId: 'google-456' })

    const result = UserPresenter.hasLinkedProviders(user)

    assert.isTrue(result)
  })

  test('hasLinkedProviders: should return true when user has facebook', async ({ assert }) => {
    const user = await UserFactory.create({ facebookId: 'facebook-789' })

    const result = UserPresenter.hasLinkedProviders(user)

    assert.isTrue(result)
  })

  test('hasLinkedProviders: should return true when user has multiple providers', async ({
    assert,
  }) => {
    const user = await UserFactory.create({
      githubId: 'github-123',
      googleId: 'google-456',
      facebookId: 'facebook-789',
    })

    const result = UserPresenter.hasLinkedProviders(user)

    assert.isTrue(result)
  })

  test('hasLinkedProviders: should return false when user has no providers', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: null,
      googleId: null,
      facebookId: null,
    })

    const result = UserPresenter.hasLinkedProviders(user)

    assert.isFalse(result)
  })

  test('getLinkedProviders: should return github as linked', async ({ assert }) => {
    const user = await UserFactory.create({ githubId: 'github-123' })

    const result = UserPresenter.getLinkedProviders(user)

    assert.isTrue(result.github)
    assert.isFalse(result.google)
    assert.isFalse(result.facebook)
  })

  test('getLinkedProviders: should return google as linked', async ({ assert }) => {
    const user = await UserFactory.create({ googleId: 'google-456' })

    const result = UserPresenter.getLinkedProviders(user)

    assert.isFalse(result.github)
    assert.isTrue(result.google)
    assert.isFalse(result.facebook)
  })

  test('getLinkedProviders: should return facebook as linked', async ({ assert }) => {
    const user = await UserFactory.create({ facebookId: 'facebook-789' })

    const result = UserPresenter.getLinkedProviders(user)

    assert.isFalse(result.github)
    assert.isFalse(result.google)
    assert.isTrue(result.facebook)
  })

  test('getLinkedProviders: should return all providers as linked', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: 'github-123',
      googleId: 'google-456',
      facebookId: 'facebook-789',
    })

    const result = UserPresenter.getLinkedProviders(user)

    assert.isTrue(result.github)
    assert.isTrue(result.google)
    assert.isTrue(result.facebook)
  })

  test('getLinkedProviders: should return all providers as not linked', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: null,
      googleId: null,
      facebookId: null,
    })

    const result = UserPresenter.getLinkedProviders(user)

    assert.isFalse(result.github)
    assert.isFalse(result.google)
    assert.isFalse(result.facebook)
  })

  test('getLinkedProviders: should handle partial provider linking', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: 'github-123',
      googleId: null,
      facebookId: 'facebook-789',
    })

    const result = UserPresenter.getLinkedProviders(user)

    assert.isTrue(result.github)
    assert.isFalse(result.google)
    assert.isTrue(result.facebook)
  })

  test('real-world: format user for frontend display', async ({ assert }) => {
    const permission = await PermissionFactory.create({
      slug: 'admin.access',
      category: 'admin',
    })
    const role = await RoleFactory.create({ name: 'Admin' })
    await role.related('permissions').attach([permission.id])

    const user = await UserFactory.create({
      email: 'admin@example.com',
      fullName: 'Admin User',
      roleId: role.id,
      githubId: 'github-123',
    })
    await user.loadRoleWithPermissions()

    const result = await UserPresenter.toJSON(user)

    assert.equal(result!.email, 'admin@example.com')
    assert.equal(result!.fullName, 'Admin User')
    assert.equal(result!.role!.name, 'Admin')
    assert.equal(result!.role!.permissions[0].slug, 'admin.access')
    assert.equal(result!.githubId, 'github-123')
  })

  test('real-world: format user for public API', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'user@example.com',
      fullName: 'Public User',
      githubId: 'github-123',
      googleId: 'google-456',
    })

    const result = await UserPresenter.toPublicJSON(user)

    assert.equal(result!.email, 'user@example.com')
    assert.equal(result!.fullName, 'Public User')
    assert.notProperty(result!, 'githubId')
    assert.notProperty(result!, 'googleId')
  })

  test('consistency: toJSON and toPublicJSON should be compatible', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Test',
    })

    const full = await UserPresenter.toJSON(user)
    const publicUser = await UserPresenter.toPublicJSON(user)

    assert.equal(full!.id, publicUser!.id)
    assert.equal(full!.email, publicUser!.email)
    assert.equal(full!.fullName, publicUser!.fullName)
  })

  test('edge case: user with empty string OAuth IDs', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: '',
      googleId: '',
      facebookId: '',
    })

    const hasProviders = UserPresenter.hasLinkedProviders(user)
    const linkedProviders = UserPresenter.getLinkedProviders(user)

    assert.isFalse(hasProviders)
    assert.isFalse(linkedProviders.github)
    assert.isFalse(linkedProviders.google)
    assert.isFalse(linkedProviders.facebook)
  })

  test('edge case: role without permissions', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Empty Role' })
    const user = await UserFactory.create({ roleId: role.id })
    await user.loadRoleWithPermissions()

    const result = await UserPresenter.toJSON(user)

    assert.exists(result!.role)
    assert.equal(result!.role!.name, 'Empty Role')
    assert.lengthOf(result!.role!.permissions, 0)
  })
})
