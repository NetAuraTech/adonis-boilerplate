import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'
import { ReactNode } from 'react'
import AppShell from '#components/layouts/app_shell'
import AdminShell from '~/components/layouts/admin/admin_shell'
import i18n from '~/lib/i18n'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
      const pageModule: any = pages[`../pages/${name}.tsx`]

      if (pageModule.default.layout === undefined) {
        pageModule.default.layout = (page: ReactNode) => {
          if (name.startsWith('admin/')) {
            return <AdminShell children={page} />
          }

          return <AppShell children={page} />
        }
      }

      return pageModule
    },
    setup: ({ App, props }) => {
      // Set i18n locale from page props
      const locale = String(props.initialPage.props.locale || 'en')
      i18n.changeLanguage(locale)

      return <App {...props} />
    },
  })
}
