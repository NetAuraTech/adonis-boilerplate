import { test } from '@japa/runner'
import ProfileService from '#profile/services/profile_service'
import { UserFactory } from '#tests/helpers/factories'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import User from '#auth/models/user'
import i18n from 'i18next'
import { I18n } from '@adonisjs/i18n'
import app from '@adonisjs/core/services/app'

test.group('ProfileService', (group) => {
  let profileService: ProfileService

  group.setup(async () => {
    profileService = await app.container.make(ProfileService)
  })

  test('update: should update fullName and locale', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Old Name',
      locale: 'en',
    })

    const result = await profileService.update(
      user,
      {
        email: 'test@example.com',
        fullName: 'New Name',
        locale: 'fr',
      },
      i18n as unknown as I18n
    )

    await user.refresh()
    assert.equal(user.fullName, 'New Name')
    assert.equal(user.locale, 'fr')
    assert.isFalse(result.emailChanged)
    assert.isTrue(result.localeChanged)
  })

  test('update: should initiate email change when email differs', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()
    const user = await UserFactory.create({
      email: 'old@example.com',
      fullName: 'Test User',
      locale: 'en',
    })

    const result = await profileService.update(
      user,
      {
        email: 'new@example.com',
        fullName: 'Test User',
        locale: 'en',
      },
      i18n as unknown as I18n
    )

    await user.refresh()
    assert.isTrue(result.emailChanged)
    assert.equal(user.pendingEmail, 'new@example.com')
    assert.equal(user.email, 'old@example.com')

    mails.assertSentCount(2)

    cleanup(() => {
      mail.restore()
    })
  })

  test('update: should not change email when same email provided', async ({ assert, cleanup }) => {
    const { mails } = mail.fake()
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Test User',
      locale: 'en',
    })

    const result = await profileService.update(
      user,
      {
        email: 'test@example.com',
        fullName: 'Updated Name',
        locale: 'en',
      },
      i18n as unknown as I18n
    )

    assert.isFalse(result.emailChanged)
    mails.assertSentCount(0)

    cleanup(() => {
      mail.restore()
    })
  })

  test('update: should throw if user email not verified', async ({ assert }) => {
    const user = await UserFactory.createUnverified({
      email: 'test@example.com',
    })

    await assert.rejects(
      async () =>
        profileService.update(
          user,
          {
            email: 'new@example.com',
            fullName: 'Test',
            locale: 'en',
          },
          i18n as unknown as I18n
        ),
      i18n.t('auth.verify_email.required')
    )
  })

  test('update: should detect locale change', async ({ assert }) => {
    const user = await UserFactory.create({ locale: 'en' })

    const result1 = await profileService.update(
      user,
      {
        email: user.email,
        fullName: user.fullName!,
        locale: 'fr',
      },
      i18n as unknown as I18n
    )

    assert.isTrue(result1.localeChanged)

    const result2 = await profileService.update(
      user,
      {
        email: user.email,
        fullName: user.fullName!,
        locale: 'fr',
      },
      i18n as unknown as I18n
    )

    assert.isFalse(result2.localeChanged)
  })

  test('update: should handle optional fullName', async ({ assert }) => {
    const user = await UserFactory.create({ fullName: 'Old Name' })

    await profileService.update(
      user,
      {
        email: user.email,
        locale: 'en',
      },
      i18n as unknown as I18n
    )

    await user.refresh()
    assert.equal(user.fullName, 'Old Name')
  })

  test('updatePassword: should update password with valid current password', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'oldpassword123',
    })

    await profileService.updatePassword(user, {
      current_password: 'oldpassword123',
      password: 'newpassword456',
    })

    await user.refresh()
    const isValid = await hash.verify(user.password!, 'newpassword456')
    assert.isTrue(isValid)
  })

  test('updatePassword: should throw if current password is invalid', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'oldpassword123',
    })

    await assert.rejects(
      async () =>
        profileService.updatePassword(user, {
          current_password: 'wrongpassword',
          password: 'newpassword456',
        }),
      i18n.t('profile.password.incorrect_current')
    )
  })

  test('updatePassword: should not update password on invalid current password', async ({
    assert,
  }) => {
    const user = await UserFactory.create({
      password: 'oldpassword123',
    })
    const originalHash = user.password

    try {
      await profileService.updatePassword(user, {
        current_password: 'wrongpassword',
        password: 'newpassword456',
      })
    } catch (error) {
      // Expected to fail
    }

    await user.refresh()
    assert.equal(user.password, originalHash)
  })

  test('updatePassword: should hash new password', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'oldpassword123',
    })

    await profileService.updatePassword(user, {
      current_password: 'oldpassword123',
      password: 'newpassword456',
    })

    await user.refresh()
    assert.notEqual(user.password, 'newpassword456')
    assert.isTrue(user.password!.length > 20)
  })

  test('deleteAccount: should delete user with valid password', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'password123',
    })

    await profileService.deleteAccount(user, {
      password: 'password123',
    })

    const deletedUser = await User.find(user.id)
    assert.isNull(deletedUser)
  })

  test('deleteAccount: should throw if password is invalid', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'password123',
    })

    await assert.rejects(
      async () =>
        profileService.deleteAccount(user, {
          password: 'wrongpassword',
        }),
      i18n.t('profile.password.incorrect_password')
    )
  })

  test('deleteAccount: should not delete user on invalid password', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'password123',
    })

    try {
      await profileService.deleteAccount(user, {
        password: 'wrongpassword',
      })
    } catch (error) {
      // Expected to fail
    }

    const stillExists = await User.find(user.id)
    assert.isNotNull(stillExists)
  })

  test('cleanNotification: should not throw error', async ({ assert }) => {
    const user = await UserFactory.create()

    await assert.doesNotReject(async () => profileService.cleanNotification(user))
  })

  test('full workflow: update profile multiple times', async ({ assert, cleanup }) => {
    mail.fake()
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Original Name',
      locale: 'en',
    })

    await profileService.update(
      user,
      {
        email: 'test@example.com',
        fullName: 'First Update',
        locale: 'fr',
      },
      i18n as unknown as I18n
    )

    await user.refresh()
    assert.equal(user.fullName, 'First Update')
    assert.equal(user.locale, 'fr')

    await profileService.update(
      user,
      {
        email: 'newemail@example.com',
        fullName: 'Second Update',
        locale: 'en',
      },
      i18n as unknown as I18n
    )

    await user.refresh()
    assert.equal(user.fullName, 'Second Update')
    assert.equal(user.locale, 'en')
    assert.equal(user.pendingEmail, 'newemail@example.com')

    cleanup(() => {
      mail.restore()
    })
  })

  test('full workflow: change password then delete account', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'oldpassword',
    })

    await profileService.updatePassword(user, {
      current_password: 'oldpassword',
      password: 'newpassword',
    })

    await profileService.deleteAccount(user, {
      password: 'newpassword',
    })

    const deletedUser = await User.find(user.id)
    assert.isNull(deletedUser)
  })

  test('edge case: update with all fields identical', async ({ assert }) => {
    const user = await UserFactory.create({
      email: 'test@example.com',
      fullName: 'Test User',
      locale: 'en',
    })

    const result = await profileService.update(
      user,
      {
        email: 'test@example.com',
        fullName: 'Test User',
        locale: 'en',
      },
      i18n as unknown as I18n
    )

    assert.isFalse(result.emailChanged)
    assert.isFalse(result.localeChanged)
  })

  test('edge case: update password to same password', async ({ assert }) => {
    const user = await UserFactory.create({
      password: 'samepassword',
    })

    await profileService.updatePassword(user, {
      current_password: 'samepassword',
      password: 'samepassword',
    })

    await user.refresh()
    const isValid = await hash.verify(user.password!, 'samepassword')
    assert.isTrue(isValid)
  })
})
