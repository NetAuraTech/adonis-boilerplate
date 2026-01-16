import { ReactNode } from 'react'
import { PageHeader } from '~/components/layouts/page_header'
import { FlashMessages } from '~/components/elements/flash_messages/flash_messages'
import { Head, usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { EmailVerificationAlert } from '~/components/elements/email_verification_alert'
import { FlashProvider } from '~/components/elements/flash_messages/flash_context'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell(props: AppShellProps) {
  const { children } = props
  const pageProps = usePage<SharedProps>().props

  const showVerificationAlert =
    pageProps.currentUser &&
    !pageProps.currentUser.emailVerifiedAt

  return <FlashProvider>
    <div id="page-wrapper" className="bg-neutral-100">
      <Head>
        <meta name="csrf-token" content={pageProps.csrfToken} />
      </Head>
      <PageHeader />
      <EmailVerificationAlert isVisible={!!showVerificationAlert} />
      <FlashMessages />
      {children}
    </div>
  </FlashProvider>
}
