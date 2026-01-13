import { useState } from 'react'
import { AdminHeader } from '~/components/layouts/admin/admin_header'
import { AdminNav } from '~/components/layouts/admin/admin_nav'
import { buildAdminNav } from '~/helpers/admin'
import { FlashMessages } from '~/components/elements/flash_messages'
import { Head, usePage } from '@inertiajs/react'
import type { SharedProps } from '@adonisjs/inertia/types'

interface LayoutProps {
  children: React.ReactNode
}

export default function AdminShell({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageProps = usePage<SharedProps>().props
  const handleNavButtonClick = () => {
    setSidebarOpen(!sidebarOpen)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const closeMenu = () => {
    setSidebarOpen(false)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const navWidth = 350

  return (
    <div className="display-flex min-h-screen bg-neutral-100">
      <Head>
        <meta name="csrf-token" content={pageProps.csrfToken} />
      </Head>
      <FlashMessages />
      <AdminNav sidebarOpen={sidebarOpen} categories={buildAdminNav()} setIsMenuOpen={closeMenu} width={navWidth}/>
      <div
        className="main-content"
        style={{
          marginLeft: '0',
          width: '100%',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <AdminHeader handleClick={handleNavButtonClick} />
        <main className="padding-6">
          {children}
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="display-block lg:display-hidden fixed inset-0 bg-neutral-1000 opacity-50"
          style={{ zIndex: 90 }}
          onClick={() => closeMenu()}
        />
      )}

      <style>{`
        @media (min-width: 65em) {
          .sidebar {
            transform: translateX(0) !important;
          }
          .main-content {
            margin-left: ${navWidth}px !important;
            width: calc(100% - ${navWidth}px) !important;
          }
        }
      `}</style>
    </div>
  )
}
