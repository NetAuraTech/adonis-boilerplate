import { ReactNode } from 'react'
import { PageHeader } from '~/components/layouts/page_header'
import { FlashMessages } from '~/components/elements/flash_messages'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { EmailVerificationAlert } from '~/components/elements/email_verification_alert'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell(props: AppShellProps) {
  const { children } = props
  const { currentUser } = usePage<SharedProps>().props

  const showVerificationAlert =
    currentUser &&
    !currentUser.emailVerifiedAt

  return <div id="page-wrapper">
    <PageHeader />
    <EmailVerificationAlert isVisible={!!showVerificationAlert} />
    <FlashMessages />
    {children}
  </div>
}
