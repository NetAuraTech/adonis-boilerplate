import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import User from '#auth/models/user'
import string from '@adonisjs/core/helpers/string'
import Token from '#core/models/token'
import router from '@adonisjs/core/services/router'
import Env from '#start/env'

export default class PasswordService {
  async sendResetPasswordLink(user: User) {
    const token = string.generateRandom(64)

    await Token.expirePasswordResetTokens(user)

    const record = await user.related('tokens').create({
      type: 'PASSWORD_RESET',
      expiresAt: DateTime.now().plus({ hour: 1 }),
      token,
    })

    const resetLink = router.makeUrl('auth.reset.password', [record.token])

    await mail.send((message) => {
      message
        .to(user.email)
        .from('noreply@tonsite.com')
        .subject('Reset your password')
        .html(`Reset your password by <a href="${Env.get('DOMAIN')}${resetLink}">clicking here</a>`)
    })
  }
}
