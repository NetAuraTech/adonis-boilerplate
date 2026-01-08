import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SocialService from '#auth/services/social_service'
import { isProviderEnabled } from '#config/ally'
import { regenerateCsrfToken } from '#core/helpers/csrf'
import ErrorHandlerService from '#core/services/error_handler_service'
import AuthValidators from '#auth/validators/auth_validators'
import ProviderNotConfiguredException from '#core/exceptions/provider_not_configured_exception'

type OAuthProvider = 'github' | 'google' | 'facebook'

@inject()
export default class SocialController {
  constructor(
    protected socialService: SocialService,
    protected errorHandler: ErrorHandlerService
  ) {}

  protected validateProvider(provider: string): void {
    if (!isProviderEnabled(provider)) {
      throw new ProviderNotConfiguredException(provider)
    }
  }

  async redirect(ctx: HttpContext) {
    const { ally, params } = ctx
    const provider = params.provider as OAuthProvider

    try {
      this.validateProvider(provider)
      return ally.use(provider).redirect()
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async callback(ctx: HttpContext) {
    const { ally, params, auth, response, session, i18n } = ctx
    const provider = params.provider as OAuthProvider

    try {
      this.validateProvider(provider)

      const allyUser = await ally.use(provider).user()
      const authenticatedUser = auth.user

      if (authenticatedUser) {
        await this.socialService.linkProvider(authenticatedUser, allyUser, provider)
        regenerateCsrfToken(ctx)
        session.flash('success', i18n.t('auth.social.linked', { provider }))
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
      return this.errorHandler.handle(ctx, error)
    }
  }

  async unlink(ctx: HttpContext) {
    const { auth, params, response, session, i18n } = ctx
    const provider = params.provider as OAuthProvider

    try {
      this.validateProvider(provider)

      const user = auth.getUserOrFail()
      await this.socialService.unlinkProvider(user, provider)

      regenerateCsrfToken(ctx)
      session.flash('success', i18n.t('auth.social.unlinked', { provider }))

      return response.redirect().back()
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  render(ctx: HttpContext) {
    const { inertia } = ctx

    try {
      return inertia.render('auth/define_password')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(AuthValidators.definePassword())

      user.password = payload.password
      await user.save()

      session.flash('success', i18n.t('auth.social.password_defined'))
      return response.redirect().toRoute('profile.show')
    } catch (error) {
      return this.errorHandler.handle(ctx, error)
    }
  }
}
