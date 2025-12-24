import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const form = useForm({ email: '' })

  const validation = useFormValidation({
    email: presets.email,
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isValid = validation.validateAll(form.data)

    if (isValid) {
      form.post('/forgot-password')
    }
  }

  return (
    <>
      <Head title={t('forgot_password.title')} />
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
          <h1 className="heading-1">{t('forgot_password.title')}</h1>
          <p className="clr-neutral-600">{t('forgot_password.subtitle')}</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label={t('forgot_password.email')}
              name="email"
              type="email"
              placeholder={t('forgot_password.email_placeholder')}
              value={form.data.email}
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
            <div className="flex gap-3">
              <Button loading={form.processing} fitContent>
                {t('forgot_password.submit')}
              </Button>
              <Button fitContent href="/login" variant="outline">
                {t('forgot_password.back_to_login')}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}
