import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import EmailChangeService from '#auth/services/email_change_service'
import { Exception } from '@adonisjs/core/exceptions'
import User from '#auth/models/user'
import i18n from 'i18next'
import { I18n } from '@adonisjs/i18n'
import NotificationService from '#notification/services/notification_service'

interface UpdatePayload {
  email: string
  locale: string
  fullName?: string
}

interface UpdatePasswordPayload {
  current_password: string
  password: string
}

interface DeletePayload {
  password: string
}

@inject()
export default class ProfileService {
  constructor(
    protected emailChangeService: EmailChangeService,
    protected notificationService: NotificationService
  ) {}

  async update(user: User, payload: UpdatePayload, translator: I18n) {
    if (!user.isEmailVerified) {
      throw new Exception(i18n.t('auth.verify_email.required'), {
        code: 'E_EMAIL_NOT_VERIFIED',
        status: 403,
      })
    }

    const emailChanged = user.email !== payload.email
    if (emailChanged) {
      await this.emailChangeService.initiateEmailChange(user, payload.email, translator)
    }

    const localeChanged = user.locale !== payload.locale

    user.merge({ fullName: payload.fullName, locale: payload.locale })
    await user.save()
    return { emailChanged, localeChanged: localeChanged }
  }

  async updatePassword(user: User, payload: UpdatePasswordPayload) {
    const isPasswordValid = await hash.verify(user.password!, payload.current_password)

    if (!isPasswordValid) {
      throw new Exception(i18n.t('profile.password.incorrect_current'), {
        code: 'E_INVALID_CURRENT_PASSWORD',
        status: 400,
      })
    }

    user.password = payload.password
    await user.save()
  }

  async deleteAccount(user: User, payload: DeletePayload) {
    const isPasswordValid = await hash.verify(user.password!, payload.password)

    if (!isPasswordValid) {
      throw new Exception(i18n.t('profile.password.incorrect_password'), {
        code: 'E_INVALID_PASSWORD',
        status: 400,
      })
    }

    await user.delete()
  }

  async cleanNotification(user: User) {
    return await this.notificationService.deleteAllForUser(user.id)
  }
}
