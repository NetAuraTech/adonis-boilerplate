import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import EmailChangeService from '#auth/services/email_change_service'
import { Exception } from '@adonisjs/core/exceptions'
import User from '#auth/models/user'
import i18n from 'i18next'
import { I18n } from '@adonisjs/i18n'
import NotificationService from '#notification/services/notification_service'
import LogService from '#core/services/log_service'

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
    protected notificationService: NotificationService,
    protected logService: LogService
  ) {}

  async update(user: User, payload: UpdatePayload, translator: I18n) {
    if (!user.isEmailVerified) {
      this.logService.logSecurity('Attempt to update profile with unverified email', {
        userId: user.id,
        userEmail: user.email,
      })

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

    const oldData = {
      fullName: user.fullName,
      locale: user.locale,
    }

    user.merge({ fullName: payload.fullName, locale: payload.locale })
    await user.save()

    this.logService.logBusiness(
      'profile.updated',
      {
        userId: user.id,
        userEmail: user.email,
      },
      {
        oldData,
        newData: {
          fullName: user.fullName,
          locale: user.locale,
        },
        emailChanged,
        localeChanged,
      }
    )

    return { emailChanged, localeChanged }
  }

  async updatePassword(user: User, payload: UpdatePasswordPayload) {
    const isPasswordValid = await hash.verify(user.password!, payload.current_password)

    if (!isPasswordValid) {
      this.logService.logSecurity('Failed password change attempt - invalid current password', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new Exception(i18n.t('profile.password.incorrect_current'), {
        code: 'E_INVALID_CURRENT_PASSWORD',
        status: 400,
      })
    }

    user.password = payload.password
    await user.save()

    this.logService.logAuth('password.changed', {
      userId: user.id,
      userEmail: user.email,
    })
  }

  async deleteAccount(user: User, payload: DeletePayload) {
    const isPasswordValid = await hash.verify(user.password!, payload.password)

    if (!isPasswordValid) {
      this.logService.logSecurity('Failed account deletion attempt - invalid password', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new Exception(i18n.t('profile.password.incorrect_password'), {
        code: 'E_INVALID_PASSWORD',
        status: 400,
      })
    }

    this.logService.logBusiness(
      'account.deleted',
      {
        userId: user.id,
        userEmail: user.email,
      },
      {
        deletedAt: new Date().toISOString(),
      }
    )

    await user.delete()
  }

  async cleanNotification(user: User) {
    const count = await this.notificationService.deleteAllForUser(user.id)

    this.logService.logBusiness(
      'notifications.cleaned',
      {
        userId: user.id,
        userEmail: user.email,
      },
      {
        count,
      }
    )

    return count
  }
}
