import type { HttpContext } from '@adonisjs/core/http'
import SocialService from '#auth/services/social_service'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import { isProviderEnabled } from '#config/ally'
import { regenerateCsrfToken } from '#core/helpers/csrf'

type OAuthProvider = 'github' | 'google' | 'facebook'

@inject()
export default class SocialController {
  constructor(protected socialService: SocialService) {}

  static definePasswordValidator = vine.compile(
    vine.object({
      password: vine.string().minLength(8).confirmed(),
    })
  )

  protected validateProvider(provider: string, session: any, response: any, i18n: any) {
    if (!isProviderEnabled(provider)) {
      session.flash('error', i18n.t('auth.social.not_configured', { provider }))
      return response.redirect().toRoute('auth.login')
    }
    return null
  }

  async redirect({ ally, params, session, response, i18n }: HttpContext) {
    const provider = params.provider as OAuthProvider

    const validation = this.validateProvider(provider, session, response, i18n)
    if (validation) return validation

    return ally.use(provider).redirect()
  }

  async callback({ ally, params, auth, request, response, session, i18n }: HttpContext) {
    const provider = params.provider as OAuthProvider

    const validation = this.validateProvider(provider, session, response, i18n)
    if (validation) return validation

    try {
      const allyUser = await ally.use(provider).user()

      const authenticatedUser = auth.user

      if (authenticatedUser) {
        try {
          await this.socialService.linkProvider(authenticatedUser, allyUser, provider)
          regenerateCsrfToken({ auth, request, response, session } as HttpContext)
          session.flash('success', i18n.t('auth.social.linked', { provider }))
        } catch (error) {
          session.flash('error', error.message)
        }
        return response.redirect().toRoute('profile.show')
      }

      const user = await this.socialService.findOrCreateUser(allyUser, provider)

      await auth.use('web').login(user)

      if (this.socialService.needsPasswordSetup(user)) {
        session.flash('info', i18n.t('auth.social.set_password_info'))
        return response.redirect().toRoute('oauth.define.password')
      }

      session.flash('success', i18n.t('auth.login.success'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      console.error('OAuth error:', error)
      session.flash('error', i18n.t('auth.login.failed'))
      return response.redirect().toRoute('auth.login')
    }
  }

  async unlink({ auth, params, request, response, session, i18n }: HttpContext) {
    const provider = params.provider as OAuthProvider

    const validation = this.validateProvider(provider, session, response, i18n)
    if (validation) return validation

    try {
      const user = auth.getUserOrFail()
      await this.socialService.unlinkProvider(user, provider)

      regenerateCsrfToken({ auth, request, response, session } as HttpContext)
      session.flash('success', i18n.t('auth.social.unlinked', { provider }))
    } catch (error) {
      session.flash('error', i18n.t('auth.social.unlink_failed'))
    }

    return response.redirect().back()
  }

  render({ inertia }: HttpContext) {
    return inertia.render('auth/define_password')
  }

  async execute({ auth, request, response, session, i18n }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(SocialController.definePasswordValidator)

    user.password = payload.password
    await user.save()

    session.flash('success', i18n.t('auth.social.password_defined'))
    return response.redirect().toRoute('profile.show')
  }
}
