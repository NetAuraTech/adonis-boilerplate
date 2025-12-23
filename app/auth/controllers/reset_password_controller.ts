import type { HttpContext } from '@adonisjs/core/http'
import Token from '#core/models/token'
import vine from '@vinejs/vine'
import logger from '@adonisjs/core/services/logger'
import { maskToken } from '#core/helpers/crypto'

export default class ResetPasswordController {
  static validator = vine.compile(
    vine.object({
      token: vine.string(),
      password: vine.string().minLength(8).confirmed(),
    })
  )

  async render({ inertia, params, session, response, i18n }: HttpContext) {
    const token = params.token

    const isValid = await Token.verify(token)

    if (!isValid) {
      const exceededAttempts = await Token.hasExceededAttempts(token)

      if (exceededAttempts) {
        logger.warn('Password reset token exceeded max attempts', {
          token: maskToken(token),
        })
        session.flash('error', i18n.t('auth.reset_password.max_attempts_exceeded'))
      } else {
        logger.warn('Invalid or expired password reset token', {
          token: maskToken(token),
        })
        session.flash('error', i18n.t('auth.reset_password.invalid_token'))
      }

      return response.redirect().toRoute('auth.forgot_password')
    }

    return inertia.render('auth/reset_password', { token })
  }

  async execute({ request, response, session, auth, i18n }: HttpContext) {
    const { token: plainToken } = request.only(['token'])
    await Token.incrementAttempts(plainToken)

    const exceededAttempts = await Token.hasExceededAttempts(plainToken)

    if (exceededAttempts) {
      logger.error('Password reset max attempts exceeded', {
        token: maskToken(plainToken),
        ip: request.ip(),
      })
      session.flash('error', i18n.t('auth.reset_password.max_attempts_exceeded'))
      return response.redirect().toRoute('auth.forgot_password')
    }

    const data = await request.validateUsing(ResetPasswordController.validator)

    const user = await Token.getPasswordResetUser(data.token)

    if (!user) {
      logger.warn('Failed password reset attempt - invalid token', {
        token: maskToken(data.token),
        ip: request.ip(),
      })
      session.flash('error', i18n.t('auth.reset_password.invalid_token'))
      return response.redirect().toRoute('auth.forgot_password')
    }

    user.password = data.password
    await user.save()

    await Token.expirePasswordResetTokens(user)

    await auth.use('web').login(user)

    logger.info('Password reset successful', {
      userId: user.id,
      token: maskToken(data.token),
    })

    session.flash('success', i18n.t('auth.reset_password.success'))
    return response.redirect().toRoute('profile.show')
  }
}
