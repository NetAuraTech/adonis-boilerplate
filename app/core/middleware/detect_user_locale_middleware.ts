import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

/**
 * Detect user locale middleware with priority:
 * 1. User preference (from database if authenticated)
 * 2. Accept-Language header
 * 3. Default locale (en)
 */
export default class DetectUserLocaleMiddleware {
  /**
   * Using i18n for validation messages. Applicable to only
   * "request.validateUsing" method calls
   */
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  /**
   * This method detects user language with the following priority:
   * 1. User preference from database (if authenticated)
   * 2. Accept-Language header from browser
   * 3. Default locale
   */
  protected getRequestLocale(ctx: HttpContext): string {
    // Priority 1: Check user preference (if authenticated)
    if (ctx.auth.user?.locale) {
      return ctx.auth.user.locale
    }

    // Priority 2: Check Accept-Language header
    const userLanguages = ctx.request.languages()
    const browserLocale = i18nManager.getSupportedLocaleFor(userLanguages)

    if (browserLocale) {
      return browserLocale
    }

    // Priority 3: Default locale
    return i18nManager.defaultLocale
  }

  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Finding user language based on priority
     */
    const language = this.getRequestLocale(ctx)

    /**
     * Assigning i18n property to the HTTP context
     */
    ctx.i18n = i18nManager.locale(language)

    /**
     * Binding I18n class to the request specific instance of it.
     * Doing so will allow IoC container to resolve an instance
     * of request specific i18n object when I18n class is
     * injected somewhere.
     */
    ctx.containerResolver.bindValue(I18n, ctx.i18n)

    /**
     * Sharing request specific instance of i18n with edge
     * templates.
     */
    if ('view' in ctx) {
      ctx.view.share({ i18n: ctx.i18n })
    }

    return next()
  }
}

/**
 * Notify TypeScript about i18n property
 */
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}
