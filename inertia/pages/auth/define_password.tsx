import { FormEvent } from 'react'
import { Panel } from '#components/elements/panel'
import { InputGroup } from '#components/forms/input_group'
import { Button } from '#components/elements/button'
import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

export default function DefinePasswordPage() {
  const { t } = useTranslation('auth')
  const form = useForm({ password: '', password_confirmation: '' })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/oauth/define-password')
  }

  const isPasswordValid = form.data.password.length >= 8
  const isConfirmValid =
    form.data.password_confirmation === form.data.password && form.data.password !== ''

  return (
    <>
      <Head title={t('define_password.title')} />
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
          <h1 className="heading-1">{t('define_password.title')}</h1>
          <p className="clr-neutral-600">{t('define_password.subtitle')}</p>
        </div>
        <Panel>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <InputGroup
              label={t('define_password.password')}
              name="password"
              type="password"
              errorMessage={form.errors.password}
              onChange={(event) => form.setData('password', event.target.value)}
              required={true}
              helpText={t('define_password.password_help')}
              helpClassName={isPasswordValid ? 'clr-green-500' : 'clr-red-400'}
            />
            <InputGroup
              label={t('define_password.confirmation')}
              name="password_confirmation"
              type="password"
              errorMessage={form.errors.password_confirmation}
              onChange={(event) => form.setData('password_confirmation', event.target.value)}
              required={true}
              helpText={t('define_password.confirmation_help')}
              helpClassName={isConfirmValid ? 'clr-green-500' : 'clr-red-400'}
            />
            <Button loading={form.processing} fitContent>
              {t('define_password.submit')}
            </Button>
          </form>
        </Panel>
      </div>
    </>
  )
}
