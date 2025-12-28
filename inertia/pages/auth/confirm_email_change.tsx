import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/elements/button'
import { Panel } from '~/components/elements/panel'
import { FormEvent } from 'react'

interface ConfirmEmailChangeProps {
  token: string
}

export default function ConfirmEmailChange({ token }: ConfirmEmailChangeProps) {
  const { t } = useTranslation('auth')
  const form = useForm({ token: token })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post(`/email/change/${form.data.token}`)
  }

  return (
    <>
      <Head title={t('email_change.confirm_title')} />
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
          <h1 className="heading-1">{t('email_change.confirm_title')}</h1>
          <p className="clr-neutral-600">{t('email_change.confirm_subtitle')}</p>
        </div>
        <Panel>
          <div
            className="bg-yellow-100 border-yellow-600 border-solid border-3 padding-4 border-radius-2 margin-block-start-3"
          >
            <h4 className="heading-4 margin-block-end-1 clr-neutral-200">
              ℹ️ {t('email_change.info_title')}
            </h4>
            <p className="fs-300 clr-blue-800" style={{ margin: 0 }}>
              {t('email_change.info_message')}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="margin-block-start-6">
            <div className="flex gap-3">
              <Button loading={form.processing} fitContent>
                {t('email_change.confirm_button')}
              </Button>
              <Button fitContent href="/login" variant="outline">
                {t('email_change.cancel')}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}
