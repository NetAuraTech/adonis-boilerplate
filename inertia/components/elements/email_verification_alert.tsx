import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/elements/button'

interface EmailVerificationAlertProps {
  isVisible: boolean
}

export function EmailVerificationAlert({ isVisible }: EmailVerificationAlertProps) {
  const { t } = useTranslation('auth')

  if (!isVisible) {
    return null
  }

  const handleResend = () => {
    router.post('/email/resend', {}, {
      preserveScroll: true,
    })
  }

  return (
    <div className="bg-yellow-100 border-yellow-400 padding-block-4">
      <div className="container flex gap-3" style={{ alignItems: 'center' }}>
        <div className="flex-1">
          <p className="fs-400 fw-semi-bold clr-yellow-900" style={{ margin: 0 }}>
            ⚠️ {t('verify_email.alert_title')}
          </p>
          <p className="fs-300 clr-yellow-800" style={{ margin: 0, marginTop: '0.25rem' }}>
            {t('verify_email.alert_message')}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleResend}
          variant="primary"
          fitContent
        >
          {t('verify_email.resend_button')}
        </Button>
      </div>
    </div>
  )
}
