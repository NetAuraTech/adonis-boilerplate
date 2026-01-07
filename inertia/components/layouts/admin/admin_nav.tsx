import { Link, router, usePage } from '@inertiajs/react'
import logo from '~/assets/logo.png'
import { AdminNavCategoryDisplay } from '~/types/admin'
import { useEffect } from 'react'
import { CanAccess } from '~/components/auth/can_access'

interface AdminNavProps {
  sidebarOpen: boolean
  categories: AdminNavCategoryDisplay[]
  setIsMenuOpen: (value: boolean) => void
}

export function AdminNav(props: AdminNavProps) {
  const { sidebarOpen, categories, setIsMenuOpen } = props

  const { url } = usePage();
  const isActive = (href: string) => {
    return url === href || url.startsWith(`${href}/`);
  }

  useEffect(() => {
    const unregisterListener = router.on('success', () => {
      setIsMenuOpen(false)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })

    return () => unregisterListener()
  }, [setIsMenuOpen])

  return (
    <aside
      className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '250px',
        backgroundColor: 'hsl(230, 24%, 18%)',
        color: 'white',
        overflowY: 'auto',
        transition: 'transform 0.3s ease',
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      <div className="padding-6 border-bottom-1 border-neutral-700">
        <Link href="/admin" className="display-flex align-items-center">
          <img src={logo} alt="Logo" />
        </Link>
      </div>
      <nav className="padding-4">
        {
          categories && categories.map(category => <div key={`admin-category-${category.label}`} className="margin-block-end-4">
            <h4 className="heading-4 clr-neutral-1000 uppercase padding-inline-3 margin-block-end-2">
              { category.label }
            </h4>
            <ul className="display-flex flex-column gap-1">
              {
                category.links && category.links.map(link => <li key={`admin-category-${category.label}-${link.label}`}>
                  <CanAccess permission={link.permission}>
                    <Link
                      href={link.path}
                      className="display-flex align-items-center gap-2 padding-3 border-radius-1 clr-neutral-800 hover:clr-neutral-1000 hover:bg-primary-500 current:bg-primary-500 current:clr-neutral-1000 transition:bg-300 transition:clr-300"
                      aria-current={isActive(link.path) ? 'page' : undefined}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: link.icon }}/>
                      { link.label }
                    </Link>
                  </CanAccess>
                </li>)
              }
            </ul>
          </div>)
        }
      </nav>
    </aside>
  )
}
