import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

interface CsrfErrorProps {
  error?: {
    message: string
  }
}

export default function CsrfTokenMismatch({ error }: CsrfErrorProps) {
  const { t } = useTranslation('errors')

  return (
    <>
      <Head title={t('csrf_token_mismatch.title')} />

      <div className="container padding-block-20">
        <div className="display-flex flex-column gap-8 align-items-center text-center">
          <div className="fs-900 fw-bold clr-accent-600">419</div>
          <h1 className="fs-700 fw-bold clr-neutral-900">
            {t('csrf_token_mismatch.title')}
          </h1>
          <p className="fs-400 clr-neutral-700 container-narrow">
            {error?.message || t('csrf_token_mismatch.message')}
          </p>
          <div className="padding-4 bg-accent-100 border-radius-1 container-narrow">
            <p className="fs-300 clr-accent-800">
              {t('csrf_token_mismatch.explanation')}
            </p>
          </div>
          <div className="display-flex gap-4 margin-block-start-4">
            <button
              onClick={() => window.location.reload()}
              className="button button-primary"
              aria-label={t('csrf_token_mismatch.reload')}
            >
              {t('csrf_token_mismatch.reload')}
            </button>
            <a
              href="/"
              className="button button-outline"
              aria-label={t('csrf_token_mismatch.go_home')}
            >
              {t('csrf_token_mismatch.go_home')}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
