import { defineConfig, services } from '@adonisjs/ally'
import env from '#start/env'

const allyConfig = defineConfig({
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID') || 'dummy',
    clientSecret: env.get('GITHUB_CLIENT_SECRET') || 'dummy',
    callbackUrl: env.get('GITHUB_CALLBACK_URL') || 'http://localhost:3333/oauth/github/callback',
  }),
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID') || 'dummy',
    clientSecret: env.get('GOOGLE_CLIENT_SECRET') || 'dummy',
    callbackUrl: env.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3333/oauth/google/callback',
  }),
  facebook: services.facebook({
    clientId: env.get('FACEBOOK_CLIENT_ID') || 'dummy',
    clientSecret: env.get('FACEBOOK_CLIENT_SECRET') || 'dummy',
    callbackUrl:
      env.get('FACEBOOK_CALLBACK_URL') || 'http://localhost:3333/oauth/facebook/callback',
  }),
})

export default allyConfig

function isProviderConfigured(clientId?: string, clientSecret?: string): boolean {
  return !!(
    clientId &&
    clientSecret &&
    clientId.trim() !== '' &&
    clientSecret.trim() !== '' &&
    clientId !== 'dummy' &&
    clientSecret !== 'dummy'
  )
}

export const enabledProviders = (['github', 'google', 'facebook'] as const).filter((provider) => {
  const clientId = env.get(`${provider.toUpperCase()}_CLIENT_ID`)
  const clientSecret = env.get(`${provider.toUpperCase()}_CLIENT_SECRET`)
  return isProviderConfigured(clientId, clientSecret)
}) as Array<'github' | 'google' | 'facebook'>

export function isProviderEnabled(provider: string): boolean {
  return enabledProviders.includes(provider as any)
}

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
