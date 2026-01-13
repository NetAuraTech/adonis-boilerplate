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
      <div className="container flex flex-wrap gap-3 align-items-center justify-content-space-between">
        <div className="grid gap-1">
          <strong className="clr-yellow-800">
            ⚠️ {t('verify_email.alert_title')}
          </strong>
          <p className="fs-300 clr-yellow-800">
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
