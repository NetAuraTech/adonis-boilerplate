import { test } from '@japa/runner'
import { UserFactory, RoleFactory, PermissionFactory } from '#tests/helpers/factories'
import { DateTime } from 'luxon'
import Token, { TOKEN_TYPES } from '#core/models/token'

test.group('User Model', () => {
  test('isEmailVerified: should return true when email is verified', async ({ assert }) => {
    const user = await UserFactory.create({
      emailVerifiedAt: DateTime.now(),
    })

    assert.isTrue(user.isEmailVerified)
  })

  test('isEmailVerified: should return false when email is not verified', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    assert.isFalse(user.isEmailVerified)
  })

  test('hasPendingEmailChange: should return true when pending email exists', async ({
    assert,
  }) => {
    const user = await UserFactory.create({
      pendingEmail: 'newemail@example.com',
    })

    assert.isTrue(user.hasPendingEmailChange)
  })

  test('hasPendingEmailChange: should return false when no pending email', async ({ assert }) => {
    const user = await UserFactory.create({
      pendingEmail: null,
    })

    assert.isFalse(user.hasPendingEmailChange)
  })

  test('hasRole: should return true when user has the role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'editor' })
    const user = await UserFactory.create({ roleId: role.id })

    const hasRole = await user.hasRole('editor')
    assert.isTrue(hasRole)
  })

  test('hasRole: should return false when user does not have the role', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'editor' })
    const user = await UserFactory.create({ roleId: role.id })

    const hasRole = await user.hasRole('admin')
    assert.isFalse(hasRole)
  })

  test('hasRole: should return false when user has no role', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    const hasRole = await user.hasRole('admin')
    assert.isFalse(hasRole)
  })

  test('hasAnyRole: should return true when user has one of the roles', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'editor' })
    const user = await UserFactory.create({ roleId: role.id })

    const hasAnyRole = await user.hasAnyRole(['admin', 'editor', 'moderator'])
    assert.isTrue(hasAnyRole)
  })

  test('hasAnyRole: should return false when user has none of the roles', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'editor' })
    const user = await UserFactory.create({ roleId: role.id })

    const hasAnyRole = await user.hasAnyRole(['admin', 'moderator'])
    assert.isFalse(hasAnyRole)
  })

  test('can: should return true when user has permission', async ({ assert }) => {
    const permission = await PermissionFactory.create({ slug: 'users.create' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])
    const user = await UserFactory.create({ roleId: role.id })

    const can = await user.can('users.create')
    assert.isTrue(can)
  })

  test('can: should return false when user does not have permission', async ({ assert }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create({ roleId: role.id })

    const can = await user.can('users.delete')
    assert.isFalse(can)
  })

  test('can: should return false when user has no role', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    const can = await user.can('users.create')
    assert.isFalse(can)
  })

  test('isAdmin: should return true for admin role', async ({ assert }) => {
    const adminRole = await RoleFactory.create({ slug: 'admin' })
    const user = await UserFactory.create({ roleId: adminRole.id })

    const isAdmin = await user.isAdmin()
    assert.isTrue(isAdmin)
  })

  test('isAdmin: should return false for non-admin role', async ({ assert }) => {
    const userRole = await RoleFactory.create({ slug: 'user' })
    const user = await UserFactory.create({ roleId: userRole.id })

    const isAdmin = await user.isAdmin()
    assert.isFalse(isAdmin)
  })

  test('status: should return PENDING_INVITE when user has invitation token', async ({
    assert,
  }) => {
    const user = await UserFactory.createUnverified()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.USER_INVITATION,
      selector: 'test-selector',
      token: 'test-token',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    await user.load('tokens')
    assert.equal(user.status, 'PENDING_INVITE')
  })

  test('status: should return VERIFIED when email is verified', async ({ assert }) => {
    const user = await UserFactory.create()
    await user.load('tokens')

    assert.equal(user.status, 'VERIFIED')
  })

  test('status: should return UNVERIFIED when email is not verified', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    await user.load('tokens')

    assert.equal(user.status, 'UNVERIFIED')
  })

  test('loadRoleWithPermissions: should preload role and permissions', async ({ assert }) => {
    const permission = await PermissionFactory.create()
    const role = await RoleFactory.create()
    await role.related('permissions').attach([permission.id])
    const user = await UserFactory.create({ roleId: role.id })

    await user.loadRoleWithPermissions()

    assert.isDefined(user.role)
    assert.isDefined(user.role.permissions)
    assert.lengthOf(user.role.permissions, 1)
  })

  test('password: should be hashed automatically', async ({ assert }) => {
    const user = await UserFactory.create({ password: 'plaintext' })

    assert.notEqual(user.password, 'plaintext')
    assert.isTrue(user.password!.length > 20)
  })

  test('hasAnyRole: should return false with empty array', async ({ assert }) => {
    const role = await RoleFactory.create({ slug: 'editor' })
    const user = await UserFactory.create({ roleId: role.id })

    const hasAnyRole = await user.hasAnyRole([])
    assert.isFalse(hasAnyRole)
  })

  test('can: should handle multiple permissions correctly', async ({ assert }) => {
    const perm1 = await PermissionFactory.create({ slug: 'users.create' })
    const perm2 = await PermissionFactory.create({ slug: 'users.delete' })
    const role = await RoleFactory.create()
    await role.related('permissions').attach([perm1.id, perm2.id])
    const user = await UserFactory.create({ roleId: role.id })

    const canCreate = await user.can('users.create')
    const canDelete = await user.can('users.delete')
    const canEdit = await user.can('users.edit')

    assert.isTrue(canCreate)
    assert.isTrue(canDelete)
    assert.isFalse(canEdit)
  })

  test('loadRoleWithPermissions: should handle user without roleId', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    await user.loadRoleWithPermissions()

    assert.isUndefined(user.role)
  })
})
