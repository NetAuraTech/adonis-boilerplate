import { Head, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/elements/button'
import { Panel } from '~/components/elements/panel'
import { FormEvent } from 'react'
import { AuthIntro } from '~/components/auth/auth_intro'
import { Banner } from '~/components/elements/banner'

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
        <AuthIntro
          title={t('email_change.confirm_title')}
          text={t('email_change.confirm_subtitle')}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          }
        />
        <Panel>
          <Banner
            type="info"
            title={<>ℹ️ {t('email_change.info_title')}</>}
            message={t('email_change.info_message')}
          />
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
