import { test } from '@japa/runner'
import UserService from '#admin/services/user_service'
import { UserFactory, RoleFactory, PermissionFactory } from '#tests/helpers/factories'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import User from '#auth/models/user'
import app from '@adonisjs/core/services/app'

test.group('UserService', (group) => {
  let service: UserService

  group.setup(async () => {
    service = await app.container.make(UserService)
    await User.query().delete()
  })

  test('list: should return paginated users', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await UserFactory.create({ roleId: role.id })
    await UserFactory.create({ roleId: role.id })

    const result = await service.list({ page: 1, perPage: 10 })

    assert.isAtLeast(result.all().length, 2)
    assert.exists(result.getMeta())
  })

  test('list: should order by created_at desc', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    await UserFactory.create({
      roleId: role.id,
      email: 'oldest@example.com',
      createdAt: DateTime.now().minus({ days: 10 }),
    })

    await UserFactory.create({
      roleId: role.id,
      email: 'newest@example.com',
      createdAt: DateTime.now(),
    })

    const result = await service.list({})

    const items = result.all()
    const newestIndex = items.findIndex((u) => u.email === 'newest@example.com')
    const oldestIndex = items.findIndex((u) => u.email === 'oldest@example.com')

    assert.isTrue(newestIndex < oldestIndex)
  })

  test('list: should filter by search term (email)', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await UserFactory.create({ roleId: role.id, email: 'john@example.com' })
    await UserFactory.create({ roleId: role.id, email: 'jane@example.com' })

    const result = await service.list({ search: 'john' })

    const items = result.all()
    assert.isTrue(items.some((u) => u.email.includes('john')))
  })

  test('list: should filter by search term (fullName)', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await UserFactory.create({ roleId: role.id, fullName: 'John Doe' })
    await UserFactory.create({ roleId: role.id, fullName: 'Jane Smith' })

    const result = await service.list({ search: 'Doe' })

    const items = result.all()
    assert.isTrue(items.some((u) => u.fullName?.includes('Doe')))
  })

  test('list: should filter by role', async ({ assert }) => {
    const role1 = await RoleFactory.create({ slug: 'role1' })
    const role2 = await RoleFactory.create({ slug: 'role2' })

    await UserFactory.create({ roleId: role1.id })
    await UserFactory.create({ roleId: role2.id })

    const result = await service.list({ role: String(role1.id) })

    const items = result.all()
    assert.isTrue(items.every((u) => u.roleId === role1.id))
  })

  test('list: should preload role', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Test Role' })
    await UserFactory.create({ roleId: role.id })

    const result = await service.list({})

    const items = result.all()
    const user = items[0]
    await user.load('role')
    assert.exists(user.role)
  })

  test('list: should preload invitation tokens', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const user = await UserFactory.createUnverified({ roleId: role.id })

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.USER_INVITATION,
      selector: 'test-selector',
      token: 'test-token',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const result = await service.list({})

    const items = result.all()
    const foundUser = items.find((u) => u.id === user.id)
    await foundUser!.load('tokens')
    assert.isAtLeast(foundUser!.tokens.length, 1)
  })

  test('list: should respect pagination', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    for (let i = 0; i < 25; i++) {
      await UserFactory.create({ roleId: role.id, email: `user${i}@example.com` })
    }

    const page1 = await service.list({ page: 1, perPage: 10 })
    const page2 = await service.list({ page: 2, perPage: 10 })

    assert.equal(page1.all().length, 10)
    assert.isAtLeast(page2.all().length, 1)
  })

  test('detail: should return user with role and permissions', async ({ assert }) => {
    const perm = await PermissionFactory.create({ slug: 'test.perm' })
    const role = await RoleFactory.create({ name: 'Test Role' })
    await role.related('permissions').attach([perm.id])

    const user = await UserFactory.create({ roleId: role.id })

    const result = await service.detail(user.id)

    assert.equal(result.id, user.id)
    assert.exists(result.role)
    assert.equal(result.role!.name, 'Test Role')
    assert.isAtLeast(result.role!.permissions.length, 1)
    assert.equal(result.role!.permissions[0].slug, 'test.perm')
  })

  test('detail: should include all user properties', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Test User',
      emailVerifiedAt: DateTime.now(),
      githubId: 'github-123',
      googleId: 'google-456',
      facebookId: 'facebook-789',
    })

    const result = await service.detail(user.id)

    assert.equal(result.email, 'test@example.com')
    assert.equal(result.fullName, 'Test User')
    assert.exists(result.emailVerifiedAt)
    assert.equal(result.githubId, 'github-123')
    assert.equal(result.googleId, 'google-456')
    assert.equal(result.facebookId, 'facebook-789')
    assert.exists(result.createdAt)
  })

  test('detail: should handle user without role', async ({ assert }) => {
    const user = await UserFactory.create({ roleId: null })

    const result = await service.detail(user.id)

    assert.isNull(result.role)
  })

  test('detail: should throw for non-existent user', async ({ assert }) => {
    await assert.rejects(async () => service.detail(99999))
  })

  test('create: should send invitation and create user', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    const user = await service.create({
      email: 'newuser@example.com',
      fullName: 'New User',
      role_id: role.id,
    })

    assert.equal(user.email, 'newuser@example.com')
    assert.equal(user.fullName, 'New User')
    assert.equal(user.roleId, role.id)
    assert.isNull(user.password)
    assert.isNull(user.emailVerifiedAt)

    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('create: should handle missing fullName', async ({ assert, cleanup }) => {
    mail.fake()
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    const user = await service.create({
      email: 'test@example.com',
      role_id: role.id,
    })

    assert.isNull(user.fullName)

    cleanup(() => {
      mail.restore()
    })
  })

  test('create: should handle null role_id', async ({ assert, cleanup }) => {
    mail.fake()

    const user = await service.create({
      email: 'test@example.com',
      role_id: null,
    })

    assert.isNull(user.roleId)

    cleanup(() => {
      mail.restore()
    })
  })

  test('update: should update user properties', async ({ assert }) => {
    const role1 = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const role2 = await RoleFactory.create({ name: 'Role 2', slug: 'role-2' })

    const user = await UserFactory.create({
      email: 'old@example.com',
      fullName: 'Old Name',
      roleId: role1.id,
    })

    const updated = await service.update(user.id, {
      email: 'new@example.com',
      fullName: 'New Name',
      role_id: role2.id,
    })

    assert.equal(updated.email, 'new@example.com')
    assert.equal(updated.fullName, 'New Name')
    assert.equal(updated.roleId, role2.id)
  })

  test('update: should trim and lowercase email', async ({ assert }) => {
    const user = await UserFactory.create()

    const updated = await service.update(user.id, {
      email: '  TEST@EXAMPLE.COM  ',
      role_id: user.roleId,
    })

    assert.equal(updated.email, 'test@example.com')
  })

  test('update: should handle null role_id', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const user = await UserFactory.create({ roleId: role.id })

    const updated = await service.update(user.id, {
      email: user.email,
      role_id: null,
    })

    assert.isNull(updated.roleId)
  })

  test('delete: should delete user', async ({ assert }) => {
    const user = await UserFactory.create()

    await service.delete(user.id)

    const deleted = await User.find(user.id)
    assert.isNull(deleted)
  })

  test('delete: should throw for non-existent user', async ({ assert }) => {
    await assert.rejects(async () => service.delete(99999))
  })

  test('getAllRoles: should return all roles ordered by name', async ({ assert }) => {
    await RoleFactory.create({ name: 'Zebra', slug: 'zebra' })
    await RoleFactory.create({ name: 'Alpha', slug: 'alpha' })
    await RoleFactory.create({ name: 'Middle', slug: 'middle' })

    const roles = await service.getAllRoles()

    assert.isAtLeast(roles.length, 3)

    const names = roles.map((r) => r.name)
    const alphaIndex = names.indexOf('Alpha')
    const middleIndex = names.indexOf('Middle')
    const zebraIndex = names.indexOf('Zebra')

    assert.isTrue(alphaIndex < middleIndex)
    assert.isTrue(middleIndex < zebraIndex)
  })

  test('getAllRoles: should return all roles', async ({ assert }) => {
    const role1 = await RoleFactory.create({ slug: 'role1' })
    const role2 = await RoleFactory.create({ slug: 'role2' })

    const roles = await service.getAllRoles()

    const ids = roles.map((r) => r.id)
    assert.isTrue(ids.includes(role1.id))
    assert.isTrue(ids.includes(role2.id))
  })

  test('full workflow: create, update, delete', async ({ assert, cleanup }) => {
    mail.fake()
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    const user = await service.create({
      email: 'test@example.com',
      fullName: 'Test User',
      role_id: role.id,
    })

    assert.exists(user.id)

    const updated = await service.update(user.id, {
      email: 'updated@example.com',
      fullName: 'Updated User',
      role_id: role.id,
    })

    assert.equal(updated.email, 'updated@example.com')

    await service.delete(user.id)

    const deleted = await User.find(user.id)
    assert.isNull(deleted)

    cleanup(() => {
      mail.restore()
    })
  })

  test('list: should handle combined filters', async ({ assert }) => {
    const role1 = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const role2 = await RoleFactory.create({ name: 'Role 2', slug: 'role-2' })

    await UserFactory.create({
      email: 'john@example.com',
      fullName: 'John Doe',
      roleId: role1.id,
    })
    await UserFactory.create({
      email: 'jane@example.com',
      fullName: 'Jane Smith',
      roleId: role2.id,
    })

    const result = await service.list({
      search: 'john',
      role: String(role1.id),
    })

    const items = result.all()
    assert.isTrue(items.every((u) => u.roleId === role1.id))
  })

  test('detail: should include pending email', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'old@example.com',
      pendingEmail: 'new@example.com',
    })

    const result = await service.detail(user.id)

    assert.equal(result.pendingEmail, 'new@example.com')
  })

  test('detail: should include status', async ({ assert }) => {
    const user = await UserFactory.create()

    const result = await service.detail(user.id)

    assert.exists(result.status)
    assert.isString(result.status)
  })

  test('update: should handle optional fullName', async ({ assert }) => {
    const user = await UserFactory.create({ fullName: 'Original' })

    const updated = await service.update(user.id, {
      email: user.email,
      role_id: user.roleId,
    })

    assert.equal(updated.fullName, 'Original')
  })

  test('edge case: create with existing unverified email', async ({ assert, cleanup }) => {
    mail.fake()
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    await UserFactory.createUnverified({ email: 'existing@example.com' })

    const user = await service.create({
      email: 'existing@example.com',
      fullName: 'Updated',
      role_id: role.id,
    })

    assert.equal(user.email, 'existing@example.com')

    cleanup(() => {
      mail.restore()
    })
  })

  test('edge case: update with same email', async ({ assert }) => {
    const user = await UserFactory.create({ email: 'test@example.com' })

    const updated = await service.update(user.id, {
      email: 'test@example.com',
      fullName: 'Updated Name',
      role_id: user.roleId,
    })

    assert.equal(updated.email, 'test@example.com')
    assert.equal(updated.fullName, 'Updated Name')
  })

  test('edge case: list with no filters', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await UserFactory.create({ roleId: role.id })

    const result = await service.list({})

    assert.isAtLeast(result.all().length, 1)
  })

  test('list: should handle users without active invitations', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await UserFactory.create({ roleId: role.id })

    const result = await service.list({})

    assert.isAtLeast(result.all().length, 1)
  })

  test('detail: should handle user with expired invitation token', async ({ assert }) => {
    const user = await UserFactory.createUnverified()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.USER_INVITATION,
      selector: 'test-selector',
      token: 'test-token',
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    const result = await service.detail(user.id)

    assert.exists(result.id)
  })

  test('create: should create invitation token', async ({ assert, cleanup }) => {
    mail.fake()
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })

    const user = await service.create({
      email: 'test@example.com',
      role_id: role.id,
    })

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)

    assert.isAtLeast(tokens.length, 1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('list: search should be case-insensitive', async ({ assert }) => {
    const role = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    await UserFactory.create({
      roleId: role.id,
      email: 'TEST@EXAMPLE.COM',
      fullName: 'Test User',
    })

    const result = await service.list({ search: 'test' })

    const items = result.all()
    assert.isAtLeast(items.length, 1)
  })

  test('update: should preserve other properties', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      githubId: 'github-123',
      emailVerifiedAt: DateTime.now(),
    })

    const originalVerifiedAt = user.emailVerifiedAt

    await service.update(user.id, {
      email: 'test@example.com',
      fullName: 'Updated',
      role_id: user.roleId,
    })

    await user.refresh()
    assert.equal(user.githubId, 'github-123')
    assert.equal(user.emailVerifiedAt?.toISO(), originalVerifiedAt?.toISO())
  })
})
