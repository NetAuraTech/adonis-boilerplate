import { ReactNode } from 'react'
import { PageHeader } from '~/components/layouts/page_header'
import { FlashMessages } from '~/components/elements/flash_messages'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell(props: AppShellProps) {
  const { children } = props

  return <div id="page-wrapper">
    <PageHeader />
    <FlashMessages />
    {children}
  </div>
}
