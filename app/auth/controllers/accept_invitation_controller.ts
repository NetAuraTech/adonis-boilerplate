import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import InvitationService from '#auth/services/invitation_service'
import vine from '@vinejs/vine'
import logger from '@adonisjs/core/services/logger'
import { maskToken } from '#core/helpers/crypto'

@inject()
export default class AcceptInvitationController {
  constructor(protected invitationService: InvitationService) {}

  static validator = vine.compile(
    vine.object({
      token: vine.string(),
      full_name: vine.string().trim().minLength(2).maxLength(255).optional(),
      password: vine.string().minLength(8).confirmed(),
    })
  )

  async render({ inertia, params, session, response, i18n }: HttpContext) {
    const token = params.token

    const invitationDetails = await this.invitationService.getInvitationDetails(token)

    if (!invitationDetails) {
      logger.warn('Invalid or expired invitation token', {
        token: maskToken(token),
      })
      session.flash('error', i18n.t('auth.invitation.invalid_token'))
      return response.redirect().toRoute('auth.login')
    }

    return inertia.render('auth/accept_invitation', {
      token,
      email: invitationDetails.email,
      fullName: invitationDetails.fullName,
    })
  }

  async execute({ request, response, session, auth, i18n }: HttpContext) {
    const data = await request.validateUsing(AcceptInvitationController.validator)

    try {
      const user = await this.invitationService.acceptInvitation(
        data.token,
        data.password,
        data.full_name
      )

      if (!user) {
        logger.warn('Failed to accept invitation - invalid token', {
          token: maskToken(data.token),
        })
        session.flash('error', i18n.t('auth.invitation.invalid_token'))
        return response.redirect().toRoute('auth.login')
      }

      // Auto-login the user
      await auth.use('web').login(user)

      logger.info('Invitation accepted successfully', {
        userId: user.id,
        email: user.email,
        token: maskToken(data.token),
      })

      session.flash('success', i18n.t('auth.invitation.success'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      if (error.message === 'USER_ALREADY_EXISTS') {
        session.flash('error', i18n.t('auth.invitation.user_already_exists'))
      } else {
        session.flash('error', i18n.t('auth.invitation.failed'))
      }
      return response.redirect().back()
    }
  }
}
