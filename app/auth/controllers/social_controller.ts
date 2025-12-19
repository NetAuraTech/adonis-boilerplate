import type { HttpContext } from '@adonisjs/core/http'
import SocialService from '#auth/services/social_service'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import { isProviderEnabled } from '#config/ally'

type OAuthProvider = 'github' | 'google' | 'facebook'

@inject()
export default class SocialController {
  constructor(protected socialService: SocialService) {}

  static definePasswordValidator = vine.compile(
    vine.object({
      password: vine.string().minLength(8).confirmed(),
    })
  )

  protected validateProvider(provider: string, session: any, response: any) {
    if (!isProviderEnabled(provider)) {
      session.flash('error', `${provider} authentication is not configured.`)
      return response.redirect().toRoute('auth.login')
    }
    return null
  }

  async redirect({ ally, params, session, response }: HttpContext) {
    const provider = params.provider as OAuthProvider

    const validation = this.validateProvider(provider, session, response)
    if (validation) return validation

    return ally.use(provider).redirect()
  }

  async callback({ ally, params, auth, response, session }: HttpContext) {
    const provider = params.provider as OAuthProvider

    const validation = this.validateProvider(provider, session, response)
    if (validation) return validation

    try {
      const allyUser = await ally.use(provider).user()

      const authenticatedUser = auth.user

      if (authenticatedUser) {
        try {
          await this.socialService.linkProvider(authenticatedUser, allyUser, provider)
          session.flash('success', `Your ${provider} account has been linked successfully.`)
        } catch (error) {
          session.flash('error', error.message)
        }
        return response.redirect().toRoute('profile.show')
      }

      const user = await this.socialService.findOrCreateUser(allyUser, provider)

      await auth.use('web').login(user)

      if (this.socialService.needsPasswordSetup(user)) {
        session.flash('info', 'Please set a password for your account to enable password login.')
        return response.redirect().toRoute('oauth.define.password')
      }

      session.flash('success', 'You have been successfully logged in.')
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      console.error('OAuth error:', error)
      session.flash('error', 'Authentication failed. Please try again.')
      return response.redirect().toRoute('auth.login')
    }
  }

  async unlink({ auth, params, response, session }: HttpContext) {
    const provider = params.provider as OAuthProvider

    const validation = this.validateProvider(provider, session, response)
    if (validation) return validation

    try {
      const user = auth.getUserOrFail()
      await this.socialService.unlinkProvider(user, provider)

      session.flash('success', `Your ${provider} account has been unlinked.`)
    } catch (error) {
      session.flash('error', 'Failed to unlink account.')
    }

    return response.redirect().back()
  }

  render({ inertia }: HttpContext) {
    return inertia.render('auth/define_password')
  }

  async execute({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(SocialController.definePasswordValidator)

    user.password = payload.password
    await user.save()

    session.flash('success', 'Your password has been set successfully.')
    return response.redirect().toRoute('profile.show')
  }
}
