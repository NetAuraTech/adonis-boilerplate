import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'

interface ResetPasswordPageProps {
  token: string
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
  const { t } = useTranslation('auth')
  const { token } = props
  const form = useForm({ token: token, password: '', password_confirmation: '' })

  const validation = useFormValidation({
    password: presets.password,
    password_confirmation: presets.passwordConfirmation(form.data.password),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isValid = validation.validateAll(form.data)

    if (isValid) {
      form.post('/reset-password')
    }
  }

  return (
    <>
      <Head title={t('reset_password.title')} />
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="heading-1">{t('reset_password.title')}</h1>
          <p className="clr-neutral-600">{t('reset_password.subtitle')}</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label={t('reset_password.new_password')}
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
              helpText={t('reset_password.password_help')}
              helpClassName={validation.getHelpClassName('password')}
            />
            <InputGroup
              label={t('reset_password.confirmation')}
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
              helpText={t('reset_password.confirmation_help')}
              helpClassName={validation.getHelpClassName('password_confirmation')}
            />
            <div className="flex gap-3">
              <Button loading={form.processing} fitContent>
                {t('reset_password.submit')}
              </Button>
              <Button fitContent href="/login" variant="outline">
                {t('reset_password.back_to_login')}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}
