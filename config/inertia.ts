import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import { UserPresenter } from '#auth/presenters/user_presenter'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    currentUser: async (ctx) => await UserPresenter.toPublicJSON(ctx.auth?.user),
    locale: (ctx) => ctx.i18n?.locale || ctx.auth?.user?.locale || 'en',
    errors: (ctx) => ctx.session?.flashMessages.get('errors'),
    flash: (ctx) => {
      return {
        success: ctx.session?.flashMessages.get('success'),
        error: ctx.session?.flashMessages.get('error'),
        warning: ctx.session?.flashMessages.get('warning'),
        info: ctx.session?.flashMessages.get('info'),
      }
    },
    csrfToken: (ctx) => ctx.request.csrfToken,
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
