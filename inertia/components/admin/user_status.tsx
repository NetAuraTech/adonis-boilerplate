import { useTranslation } from 'react-i18next'
import { Button } from '~/components/elements/button'
import { router } from '@inertiajs/react'

export enum StatusEnum {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  PENDING_INVITE = 'PENDING_INVITE',
}

interface UserStatusProps {
  status: StatusEnum
  id: number
}

export function UserStatus(props: UserStatusProps) {
  const { status, id } = props

  const { t } = useTranslation('admin')

  const statuses = {
    UNVERIFIED: <span className="padding-1 padding-inline-2 bg-red-100 clr-red-700 border-1 border-solid border-red-700 border-radius-1 fs-300">
                  {t('users.status.unverified')}
                </span>,
    VERIFIED: <span className="padding-1 padding-inline-2 bg-green-100 clr-green-700 border-1 border-solid border-green-700 border-radius-1 fs-300">
                {t('users.status.verified')}
              </span>,
    PENDING_INVITE: <span className="padding-1 padding-inline-2 bg-purple-100 clr-purple-700 border-1 border-solid border-purple-700 border-radius-1 fs-300">
                      {t('users.status.pending_invite')}
                    </span>
  }


  return (
    <>
      { statuses[status] }
      {status == StatusEnum.PENDING_INVITE && (
        <Button
          onClick={() => router.post(`/admin/users/${id}/resend-invitation`)}
          variant="transparent"
          padding="padding-0"
          title={t('users.actions.resend')}
          fitContent
        >
          {t('users.actions.resend')}
        </Button>
      )}
    </>
  )
}
