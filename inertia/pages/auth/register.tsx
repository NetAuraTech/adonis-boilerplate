import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { NavLink } from '~/components/elements/nav_link'
import { getProviderRoute } from '~/helpers/oauth'
import type { OAuthProvider } from '~/types/oauth'
import { useTranslation } from 'react-i18next'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'

interface RegisterPageProps {
  providers: OAuthProvider[]
}

export default function RegisterPage(props: RegisterPageProps) {
  const { t } = useTranslation('auth')
  const form = useForm({ email: '', password: '', password_confirmation: '' })
  const { providers } = props

  const validation = useFormValidation({
    email: presets.email,
    password: presets.password,
    password_confirmation: presets.passwordConfirmation(form.data.password),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isValid = validation.validateAll(form.data)

    if (isValid) {
      form.post('/register')
    }
  }

  return (
    <>
      <Head title={t('register.title')} />
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
          <h1 className="heading-1">{t('register.title')}</h1>
          <p className="clr-neutral-600">{t('register.subtitle')}</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label={t('register.email')}
              name="email"
              type="email"
              placeholder={t('register.email_placeholder')}
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
              label={t('register.password')}
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
              helpText={t('register.password_help')}
              helpClassName={validation.getHelpClassName('password')}
            />
            <InputGroup
              label={t('register.confirmation')}
              name="password_confirmation"
              type="password"
              errorMessage={
                form.errors.password_confirmation ||
                validation.getValidationMessage('password_confirmation')
              }
              onChange={(event) => {
                form.setData('password_confirmation', event.target.value)
                validation.handleChange('password_confirmation', event.target.value)
              }}
              onBlur={(event) => {
                validation.handleBlur('password_confirmation', event.target.value)
              }}
              required
              sanitize={false}
              helpText={t('register.confirmation_help')}
              helpClassName={validation.getHelpClassName('password_confirmation')}
            />
            <Button loading={form.processing} fitContent>
              {t('register.submit')}
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
                    {t('register.or_continue_with')}
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
          {t('register.has_account')}{' '}
          <NavLink
            href="/login"
            label={t('register.login')}
            color="accent-400"
            hover_color="primary-400"
          />
        </p>
      </div>
    </>
  )
}
