import { test } from '@japa/runner'
import SocialService from '#auth/services/social_service'
import { UserFactory, RoleFactory } from '#tests/helpers/factories'
import type { AllyUserContract } from '@adonisjs/ally/types'
import LogService from '#core/services/log_service'

test.group('SocialService', (group) => {
  let socialService: SocialService
  let logService: LogService

  group.setup(() => {
    logService = new LogService()
    socialService = new SocialService(logService)
  })

  test('findOrCreateUser: should find existing user by provider ID', async ({ assert }) => {
    const existingUser = await UserFactory.create({ githubId: 'github-123' })
    const allyUser = createMockAllyUser('github-123', 'test@example.com')

    const user = await socialService.findOrCreateUser(allyUser, 'github')

    assert.equal(user.id, existingUser.id)
    assert.equal(user.githubId, 'github-123')
  })

  test('findOrCreateUser: should link provider to existing user by email', async ({ assert }) => {
    const existingUser = await UserFactory.create({
      email: 'test@example.com',
      githubId: null,
    })
    const allyUser = createMockAllyUser('github-123', 'test@example.com')

    const user = await socialService.findOrCreateUser(allyUser, 'github')

    assert.equal(user.id, existingUser.id)
    assert.equal(user.githubId, 'github-123')
  })

  test('findOrCreateUser: should verify email when linking by email', async ({ assert }) => {
    await UserFactory.createUnverified({
      email: 'test@example.com',
      githubId: null,
    })
    const allyUser = createMockAllyUser('github-123', 'test@example.com')

    const user = await socialService.findOrCreateUser(allyUser, 'github')

    await user.refresh()
    assert.isNotNull(user.emailVerifiedAt)
  })

  test('findOrCreateUser: should create new user with provider', async ({ assert }) => {
    await RoleFactory.create({ slug: 'user' })
    const allyUser = createMockAllyUser('github-456', 'newuser@example.com', 'New User')

    const user = await socialService.findOrCreateUser(allyUser, 'github')

    assert.equal(user.email, 'newuser@example.com')
    assert.equal(user.fullName, 'New User')
    assert.equal(user.githubId, 'github-456')
    assert.isNotNull(user.emailVerifiedAt)
  })

  test('findOrCreateUser: should create user with generated email if none provided', async ({
    assert,
  }) => {
    await RoleFactory.create({ slug: 'user' })
    const allyUser = createMockAllyUser('google-789', null)

    const user = await socialService.findOrCreateUser(allyUser, 'google')

    assert.match(user.email, /google_google-789@noemail\.local/)
    assert.equal(user.googleId, 'google-789')
  })

  test('findOrCreateUser: should assign user role to new users', async ({ assert }) => {
    const userRole = await RoleFactory.create({ slug: 'user' })
    const allyUser = createMockAllyUser('github-999', 'test@example.com')

    const user = await socialService.findOrCreateUser(allyUser, 'github')

    assert.equal(user.roleId, userRole.id)
  })

  test('findOrCreateUser: should handle different providers', async ({ assert }) => {
    await RoleFactory.create({ slug: 'user' })

    const githubUser = createMockAllyUser('gh-1', 'github@example.com')
    const googleUser = createMockAllyUser('gg-1', 'google@example.com')
    const facebookUser = createMockAllyUser('fb-1', 'facebook@example.com')

    const user1 = await socialService.findOrCreateUser(githubUser, 'github')
    const user2 = await socialService.findOrCreateUser(googleUser, 'google')
    const user3 = await socialService.findOrCreateUser(facebookUser, 'facebook')

    assert.equal(user1.githubId, 'gh-1')
    assert.equal(user2.googleId, 'gg-1')
    assert.equal(user3.facebookId, 'fb-1')
  })

  test('linkProvider: should link provider to user', async ({ assert }) => {
    const user = await UserFactory.create({ githubId: null })
    const allyUser = createMockAllyUser('github-link', 'test@example.com')

    await socialService.linkProvider(user, allyUser, 'github')

    await user.refresh()
    assert.equal(user.githubId, 'github-link')
  })

  test('linkProvider: should throw if provider already linked to another user', async ({
    assert,
  }) => {
    await UserFactory.create({ githubId: 'github-existing' })
    const user = await UserFactory.create({ githubId: null })
    const allyUser = createMockAllyUser('github-existing', 'test@example.com')

    await assert.rejects(
      async () => socialService.linkProvider(user, allyUser, 'github'),
      'This github account is already linked to another user.'
    )
  })

  test('linkProvider: should allow linking same provider ID to same user', async ({ assert }) => {
    const user = await UserFactory.create({ githubId: 'github-same' })
    const allyUser = createMockAllyUser('github-same', 'test@example.com')

    await socialService.linkProvider(user, allyUser, 'github')

    await user.refresh()
    assert.equal(user.githubId, 'github-same')
  })

  test('unlinkProvider: should remove provider from user', async ({ assert }) => {
    const user = await UserFactory.create({ githubId: 'github-unlink' })

    await socialService.unlinkProvider(user, 'github')

    await user.refresh()
    assert.isNull(user.githubId)
  })

  test('unlinkProvider: should handle all providers', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: 'gh-1',
      googleId: 'gg-1',
      facebookId: 'fb-1',
    })

    await socialService.unlinkProvider(user, 'github')
    await user.refresh()
    assert.isNull(user.githubId)

    await socialService.unlinkProvider(user, 'google')
    await user.refresh()
    assert.isNull(user.googleId)

    await socialService.unlinkProvider(user, 'facebook')
    await user.refresh()
    assert.isNull(user.facebookId)
  })

  test('needsPasswordSetup: should return true for OAuth user without password', async ({
    assert,
  }) => {
    const user = await UserFactory.create({
      githubId: 'github-123',
      password: null,
    })

    const needs = socialService.needsPasswordSetup(user)

    assert.isTrue(needs)
  })

  test('needsPasswordSetup: should return false for OAuth user with password', async ({
    assert,
  }) => {
    const user = await UserFactory.create({
      githubId: 'github-123',
      password: 'password123',
    })

    const needs = socialService.needsPasswordSetup(user)

    assert.isFalse(needs)
  })

  test('needsPasswordSetup: should return false for user without OAuth', async ({ assert }) => {
    const user = await UserFactory.create({
      githubId: null,
      googleId: null,
      facebookId: null,
      password: null,
    })

    const needs = socialService.needsPasswordSetup(user)

    assert.isFalse(needs)
  })

  test('needsPasswordSetup: should return true if any provider is linked', async ({ assert }) => {
    const user1 = await UserFactory.create({ githubId: 'gh-1', password: null })
    const user2 = await UserFactory.create({ googleId: 'gg-1', password: null })
    const user3 = await UserFactory.create({ facebookId: 'fb-1', password: null })

    assert.isTrue(socialService.needsPasswordSetup(user1))
    assert.isTrue(socialService.needsPasswordSetup(user2))
    assert.isTrue(socialService.needsPasswordSetup(user3))
  })
})

const createMockAllyUser = (
  id: string,
  email: string | null = null,
  name: string | null = null
): AllyUserContract<any> => {
  return {
    id,
    email,
    name,
    nickName: name,
    avatarUrl: null,
    emailVerificationState: 'verified',
    original: {},
    token: {
      token: 'mock-token',
      type: 'bearer',
    },
  } as AllyUserContract<any>
}
