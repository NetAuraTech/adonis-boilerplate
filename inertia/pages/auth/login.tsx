import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { NavLink } from '~/components/elements/nav_link'
import type { OAuthProvider } from '~/types/oauth'
import { useTranslation } from 'react-i18next'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { AuthProviders } from '~/components/auth/auth_providers'
import { AuthIntro } from '~/components/auth/auth_intro'

interface LoginPageProps {
  providers: OAuthProvider[]
}

export default function LoginPage(props: LoginPageProps) {
  const { t } = useTranslation('auth')
  const form = useForm({ email: '', password: '', remember_me: false })
  const { providers } = props

  const validation = useFormValidation({
    email: presets.email,
    password: presets.password,
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isValid = validation.validateAll(form.data)

    if (isValid) {
      form.post('/login')
    }
  }

  return (
    <>
      <Head title={t('login.title')} />
      <div className="container">
        <AuthIntro
          title={t('login.title')}
          text={t('login.subtitle')}
          icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        }
        />
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label={t('login.email')}
              name="email"
              type="email"
              placeholder={t('login.email_placeholder')}
              errorMessage={form.errors.email || validation.getValidationMessage('email')}
              onChange={(event) => {
                form.setData('email', event.target.value)
                validation.handleChange('email', event.target.value)
              }}
              onBlur={(event) => {
                validation.handleBlur('email', event.target.value)
              }}
              required
              sanitize
            />
            <InputGroup
              label={t('login.password')}
              name="password"
              type="password"
              errorMessage={form.errors.password || validation.getValidationMessage('password')}
              onChange={(event) => {
                form.setData('password', event.target.value)
                validation.handleChange('password', event.target.value)
              }}
              onBlur={(event) => {
                validation.handleBlur('password', event.target.value)
              }}
              required
              sanitize={false}
            />
            <div className="grid gap-4 md:display-flex md:align-items-center md:justify-content-space-between">
              <InputGroup
                label={t('login.remember_me')}
                name="remember_me"
                type="checkbox"
                checked={form.data.remember_me}
                onChange={(event) => form.setData('remember_me', (event.target as HTMLInputElement).checked)}
              />
              <NavLink
                href="/forgot-password"
                label={t('login.forgot_password')}
                color="accent-700"
                hover_color="accent-800"
              />
            </div>
            <Button loading={form.processing} fitContent>
              {t('login.submit')}
            </Button>
          </form>
          <AuthProviders providers={providers} />
        </Panel>
        <p className="text-center margin-block-start-11">
          {t('login.no_account')}{' '}
          <NavLink
            href="/register"
            label={t('login.create_account')}
            color="accent-700"
            hover_color="accent-800"
          />
        </p>
      </div>
    </>
  )
}
