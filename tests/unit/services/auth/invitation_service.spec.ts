import { test } from '@japa/runner'
import InvitationService from '#auth/services/invitation_service'
import { UserFactory, RoleFactory } from '#tests/helpers/factories'
import Token, { TOKEN_TYPES } from '#core/models/token'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import i18n from 'i18next'
import { I18n } from '@adonisjs/i18n'
import NotificationService from '#notification/services/notification_service'
import LogService from '#core/services/log_service'

test.group('InvitationService', (group) => {
  let invitationService: InvitationService
  let notificationService: NotificationService
  let logService: LogService

  group.setup(() => {
    logService = new LogService()
    notificationService = new NotificationService(logService)
    invitationService = new InvitationService(notificationService, logService)
  })

  test('sendInvitation: should create new user and send invitation', async ({
    assert,
    cleanup,
  }) => {
    const { mails } = mail.fake()
    const role = await RoleFactory.create()

    const user = await invitationService.sendInvitation(
      {
        email: 'newuser@example.com',
        fullName: 'New User',
        roleId: role.id,
      },
      i18n as unknown as I18n
    )

    assert.equal(user.email, 'newuser@example.com')
    assert.equal(user.fullName, 'New User')
    assert.equal(user.roleId, role.id)
    assert.isNull(user.password)
    assert.isNull(user.emailVerifiedAt)

    const tokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)

    assert.lengthOf(tokens, 1)
    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendInvitation: should update existing unverified user', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()
    const role1 = await RoleFactory.create({ name: 'Role 1', slug: 'role-1' })
    const role2 = await RoleFactory.create({ name: 'Role 2', slug: 'role-2' })

    const existingUser = await UserFactory.createUnverified({
      email: 'existing@example.com',
      fullName: 'Old Name',
      roleId: role1.id,
    })

    const user = await invitationService.sendInvitation(
      {
        email: 'existing@example.com',
        fullName: 'New Name',
        roleId: role2.id,
      },
      i18n as unknown as I18n
    )

    assert.equal(user.id, existingUser.id)
    assert.equal(user.fullName, 'New Name')
    assert.equal(user.roleId, role2.id)

    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendInvitation: should throw if user already verified', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    await UserFactory.create({
      email: 'verified@example.com',
      emailVerifiedAt: DateTime.now(),
    })

    await assert.rejects(
      async () =>
        invitationService.sendInvitation(
          {
            email: 'verified@example.com',
            fullName: 'Test',
          },
          i18n as unknown as I18n
        ),
      'User already exists'
    )

    mails.assertSentCount(0)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendInvitation: should expire old invitation tokens', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    const user = await UserFactory.createUnverified()

    await invitationService.sendInvitation(
      {
        email: user.email,
        fullName: 'Test',
      },
      i18n as unknown as I18n
    )

    const firstToken = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .firstOrFail()

    await invitationService.sendInvitation(
      {
        email: user.email,
        fullName: 'Test',
      },
      i18n as unknown as I18n
    )

    const validTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(validTokens, 1)
    assert.notEqual(validTokens[0].id, firstToken.id)

    mails.assertSentCount(2)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendInvitation: should create token with 7 days expiry', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    const user = await invitationService.sendInvitation(
      {
        email: 'test@example.com',
        fullName: 'Test',
      },
      i18n as unknown as I18n
    )

    const token = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .firstOrFail()

    const expectedExpiry = DateTime.now().plus({ days: 7 })
    const diff = token.expiresAt!.diff(expectedExpiry, 'minutes').minutes

    assert.isTrue(Math.abs(diff) < 1)

    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendInvitation: should handle missing fullName', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    const user = await invitationService.sendInvitation(
      {
        email: 'test@example.com',
      },
      i18n as unknown as I18n
    )

    assert.isNull(user.fullName)
    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('sendInvitation: should handle missing roleId', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()

    const user = await invitationService.sendInvitation(
      {
        email: 'test@example.com',
        fullName: 'Test',
      },
      i18n as unknown as I18n
    )

    assert.isNull(user.roleId)
    mails.assertSentCount(1)

    cleanup(() => {
      mail.restore()
    })
  })

  test('getInvitationDetails: should return invitation details for valid token', async ({
    assert,
  }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.createUnverified({
      email: 'test@example.com',
      fullName: 'Test User',
      roleId: role.id,
    })

    const { selector, validator } = await createInvitationToken(user)
    const fullToken = `${selector}.${validator}`

    const details = await invitationService.getInvitationDetails(fullToken)

    assert.isNotNull(details)
    assert.equal(details!.email, 'test@example.com')
    assert.equal(details!.fullName, 'Test User')
    assert.equal(details!.roleId, role.id)
    assert.equal(details!.userId, user.id)
  })

  test('getInvitationDetails: should return null for invalid token', async ({ assert }) => {
    const details = await invitationService.getInvitationDetails('invalid.token')

    assert.isNull(details)
  })

  test('getInvitationDetails: should return null for expired token', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createInvitationToken(user, {
      expiresAt: DateTime.now().minus({ days: 1 }),
    })
    const fullToken = `${selector}.${validator}`

    const details = await invitationService.getInvitationDetails(fullToken)

    assert.isNull(details)
  })

  test('getInvitationDetails: should return null for wrong validator', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector } = await createInvitationToken(user)
    const fullToken = `${selector}.wrong-validator`

    const details = await invitationService.getInvitationDetails(fullToken)

    assert.isNull(details)
  })

  test('acceptInvitation: should activate user and set password', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createInvitationToken(user)
    const fullToken = `${selector}.${validator}`

    const acceptedUser = await invitationService.acceptInvitation(
      fullToken,
      'newpassword123',
      'Updated Name'
    )

    assert.isNotNull(acceptedUser)
    assert.equal(acceptedUser!.id, user.id)
    assert.equal(acceptedUser!.fullName, 'Updated Name')
    assert.isNotNull(acceptedUser!.emailVerifiedAt)

    const isPasswordValid = await hash.verify(acceptedUser!.password!, 'newpassword123')
    assert.isTrue(isPasswordValid)
  })

  test('acceptInvitation: should verify email on acceptance', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createInvitationToken(user)
    const fullToken = `${selector}.${validator}`

    const acceptedUser = await invitationService.acceptInvitation(fullToken, 'password123')

    assert.isNotNull(acceptedUser!.emailVerifiedAt)
  })

  test('acceptInvitation: should keep existing fullName if not provided', async ({ assert }) => {
    const user = await UserFactory.createUnverified({
      fullName: 'Original Name',
    })
    const { selector, validator } = await createInvitationToken(user)
    const fullToken = `${selector}.${validator}`

    const acceptedUser = await invitationService.acceptInvitation(fullToken, 'password123')

    assert.equal(acceptedUser!.fullName, 'Original Name')
  })

  test('acceptInvitation: should expire all invitation tokens', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createInvitationToken(user)
    const fullToken = `${selector}.${validator}`

    await invitationService.acceptInvitation(fullToken, 'password123')

    const validTokens = await Token.query()
      .where('userId', user.id)
      .where('type', TOKEN_TYPES.USER_INVITATION)
      .where('expiresAt', '>', DateTime.now().toSQL())

    assert.lengthOf(validTokens, 0)
  })

  test('acceptInvitation: should return null for invalid token', async ({ assert }) => {
    const result = await invitationService.acceptInvitation('invalid.token', 'password123')

    assert.isNull(result)
  })

  test('acceptInvitation: should return null for expired token', async ({ assert }) => {
    const user = await UserFactory.createUnverified()
    const { selector, validator } = await createInvitationToken(user, {
      expiresAt: DateTime.now().minus({ days: 1 }),
    })
    const fullToken = `${selector}.${validator}`

    const result = await invitationService.acceptInvitation(fullToken, 'password123')

    assert.isNull(result)
  })

  test('acceptInvitation: should handle multiple invitations correctly', async ({ assert }) => {
    const user1 = await UserFactory.createUnverified({ email: 'user1@example.com' })
    const user2 = await UserFactory.createUnverified({ email: 'user2@example.com' })

    const token1 = await createInvitationToken(user1)
    const token2 = await createInvitationToken(user2)

    const fullToken1 = `${token1.selector}.${token1.validator}`
    const fullToken2 = `${token2.selector}.${token2.validator}`

    const accepted1 = await invitationService.acceptInvitation(fullToken1, 'password1')
    const accepted2 = await invitationService.acceptInvitation(fullToken2, 'password2')

    assert.equal(accepted1!.email, 'user1@example.com')
    assert.equal(accepted2!.email, 'user2@example.com')
  })
})

const createInvitationToken = async (
  user: any,
  override: Partial<Token> = {}
): Promise<{ selector: string; validator: string }> => {
  const selector = 'test-selector-' + Date.now()
  const validator = 'test-validator-' + Date.now()
  const hashedValidator = await hash.make(validator)

  await Token.create({
    userId: user.id,
    type: TOKEN_TYPES.USER_INVITATION,
    selector,
    token: hashedValidator,
    expiresAt: DateTime.now().plus({ days: 7 }),
    ...override,
  })

  return { selector, validator }
}
