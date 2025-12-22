import logo from '~/assets/logo.png'
import { Link, usePage, router } from '@inertiajs/react'
import type { SharedProps } from '@adonisjs/inertia/types'
import { NavLink } from '~/components/elements/nav_link'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function PageHeader() {
  const { t } = useTranslation('common')
  const pageProps = usePage<SharedProps>().props
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const unregisterListener = router.on('success', () => {
      setIsMenuOpen(false)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })

    return () => unregisterListener()
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const menuState = isMenuOpen ? 'opened' : 'closed'
  const isExpanded = isMenuOpen ? 'true' : 'false'

  return (
    <header
      className="header sticky flex justify-content-space-between align-items-center bg-neutral-200 clr-primary-100 padding-2 md:padding-block-6 md:padding-inline-12"
      data-state={menuState}
      aria-expanded={isExpanded}
    >
      <Link href="/" className="header__logo fs-600" onClick={closeMenu}>
        <img src={logo} alt="Logo" />
      </Link>

      <nav
        id="primary-navigation"
        className="header__nav grid gap-3 md:gap-6 fixed padding-4 bg-neutral-200 fs-600 border-radius-bottom-left-2 md:relative md:display-flex transition:all-500"
        data-state={menuState}
        aria-expanded={isExpanded}
      >
        <NavLink href="/" label={t('header.home')} fs={600} />

        {pageProps.currentUser ? (
          <>
            <span className="fs-400 fw-bold">
              {t('header.greeting', { name: pageProps.currentUser.fullName })}
            </span>
          </>
        ) : (
          <NavLink href="/login" label={t('header.login')} fs={600} />
        )}
      </nav>

      <button
        className="header__burger clr-primary-100 md:display-hidden"
        aria-controls="primary-navigation"
        aria-expanded={isExpanded}
        data-state={menuState}
        aria-label={t('header.menu_label')}
        onClick={toggleMenu}
      >
        <svg
          stroke="currentColor"
          fill="none"
          className="hamburger"
          viewBox="-10 -10 120 120"
          width="50"
        >
          <path
            className="line"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m 20 40 h 60 a 1 1 0 0 1 0 20 h -60 a 1 1 0 0 1 0 -40 h 30 v 70"
          ></path>
        </svg>
      </button>
    </header>
  )
}
