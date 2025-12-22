import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { NavLink } from '~/components/elements/nav_link'
import { getProviderRoute } from '~/helpers/oauth'
import { OAuthProvider } from '~/types/oauth'
import { useTranslation } from 'react-i18next'

interface LoginPageProps {
  providers: OAuthProvider[]
}
export default function LoginPage(props: LoginPageProps) {
  const { t } = useTranslation('auth')
  const form = useForm({ email: '', password: '', remember_me: false })
  const { providers } = props

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/login')
  }

  return (
    <>
      <Head title={t('login.title')} />
      <div className="container">
        <div className="text-center padding-block-8">
          <div className="display-inline-flex align-items-center justify-content-center bg-primary-300 clr-neutral-900 border-radius-4 padding-4 margin-block-end-4">
            <svg
              className="w-size-10 h-size-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="heading-1">{t('login.title')}</h1>
          <p className="clr-neutral-600">{t('login.subtitle')}</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label={t('login.email')}
              name="email"
              type="email"
              placeholder={t('login.email_placeholder')}
              errorMessage={form.errors.email}
              onChange={(event) => form.setData('email', event.target.value)}
              required={true}
            />
            <InputGroup
              label={t('login.password')}
              name="password"
              type="password"
              errorMessage={form.errors.password}
              onChange={(event) => form.setData('password', event.target.value)}
              required={true}
            />
            <div className="grid gap-4 md:display-flex md:align-items-center md:justify-content-space-between">
              <InputGroup
                label={t('login.remember_me')}
                name="remember_me"
                type="checkbox"
                errorMessage={form.errors.remember_me}
                onChange={(event) => {
                  const target = event.target as HTMLInputElement
                  form.setData('remember_me', target.checked)
                }}
                checked={form.data.remember_me}
              />
              <NavLink
                href="/forgot-password"
                label={t('login.forgot_password')}
                color="accent-400"
                hover_color="primary-400"
              />
            </div>

            <Button loading={form.processing} fitContent>
              {t('login.submit')}
            </Button>
          </form>
          {providers?.length > 0 && (
            <>
              <div className="relative margin-block-8">
                <div className="absolute inset-0 flex align-items-center">
                  <div className="w-full border-solid border-0 border-top-1 border-neutral-300"></div>
                </div>
                <div className="relative flex justify-content-center fs-500">
                  <span className="padding-inline-4 bg-neutral-000">
                    {t('login.or_continue_with')}
                  </span>
                </div>
              </div>
              <div className="grid-auto-fit gap-3">
                {providers.map((provider) => (
                  <Button
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
                  </Button>
                ))}
              </div>
            </>
          )}
        </Panel>
        <p className="text-center margin-block-start-11">
          {t('login.no_account')}{' '}
          <NavLink
            href="/register"
            label={t('login.create_account')}
            color="accent-400"
            hover_color="primary-400"
          />
        </p>
      </div>
    </>
  )
}
