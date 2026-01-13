import { Link, router, usePage } from '@inertiajs/react'
import logo from '~/assets/logo.png'
import { AdminNavCategoryDisplay } from '~/types/admin'
import { useEffect } from 'react'
import { CanAccess } from '~/components/auth/can_access'
import { Panel } from '~/components/elements/panel'
import { Heading } from '~/components/elements/heading'
import { useTranslation } from 'react-i18next'
import type { SharedProps } from '@adonisjs/inertia/types'
import { ThemeSwitcher } from '~/components/elements/theme_switcher'

interface AdminNavProps {
  sidebarOpen: boolean
  categories: AdminNavCategoryDisplay[]
  setIsMenuOpen: (value: boolean) => void,
}

export function AdminNav(props: AdminNavProps) {
  const { sidebarOpen, categories, setIsMenuOpen } = props

  const pageProps = usePage<SharedProps>().props

  const { t, i18n } = useTranslation('admin')

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
      className={`sidebar padding-4 ${sidebarOpen ? 'open' : ''} flex flex-column gap-3 bg-neutral-100`}
    >
      <Link href="/admin" className="flex gap-2 align-items-center clr-neutral-900">
        <img src={logo} className="w-10" alt="Logo" />
        <Heading level={3} className="fs-500">{ "APPNAME" }</Heading>
      </Link>
      <Panel>
        <div className="grid gap-4">
          <div className="flex align-items-center justify-content-space-between">
            <div className="flex align-items-center justify-content-center border-radius-5 w-5 h-5 bg-blue-300">A</div>
            <ThemeSwitcher initialTheme={pageProps.theme} />
          </div>
          <span className="uppercase">
            {i18n.format(new Date())}
          </span>
          <strong className="fs-700">{t('welcome', {name: pageProps.currentUser!.fullName})}</strong>
        </div>
      </Panel>
      <Panel>
        <nav>
          {
            categories && categories.map(category => <div key={`admin-category-${category.label}`} className="margin-block-end-4">
              <Heading level={4} className="uppercase padding-inline-3 margin-block-end-2">
                { category.label }
              </Heading>
              <ul className="display-flex flex-column gap-1">
                {
                  category.links && category.links.map(link => <li key={`admin-category-${category.label}-${link.label}`}>
                    <CanAccess permission={link.permission}>
                      <Link
                        href={link.path}
                        className="display-flex align-items-center gap-2 padding-3 border-radius-1 clr-neutral-800 hover:clr-neutral-100 hover:bg-primary-700 current:bg-primary-700 current:clr-neutral-100 transition:bg-300 transition:clr-300"
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
      </Panel>
    </aside>
  )
}
