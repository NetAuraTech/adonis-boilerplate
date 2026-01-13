import type { OAuthProvider } from '~/types/oauth'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/elements/button'
import { getProviderRoute } from '~/helpers/oauth'

interface AuthProvidersProps {
  providers: OAuthProvider[]
}

export function AuthProviders(props: AuthProvidersProps) {
  const { providers } = props
  const { t } = useTranslation('auth')

  return <>
    <div className="relative margin-block-8">
      <div className="absolute inset-0 flex align-items-center">
        <div className="w-full border-solid border-0 border-top-1 border-neutral-300"></div>
      </div>
      <div className="relative flex justify-content-center fs-500">
        <span className="padding-inline-4 bg-neutral-100">
          {t('login.or_continue_with')}
        </span>
      </div>
    </div>
    <div className="grid-auto-fit gap-3">
      {
        providers && providers.map(provider => <Button
          variant="social"
          href={getProviderRoute(provider.name)}
          key={`provider-${provider.name}`}
          external
        >
          <svg
            className="w-size-6 h-size-6 margin-inline-end-2"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: provider.icon }}
          />
          {provider.name}
        </Button>)
      }
    </div>
  </>
}
