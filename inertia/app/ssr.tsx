import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'
import { ReactNode } from 'react'
import AppShell from '#components/layouts/app_shell'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
      const page: any = pages[`../pages/${name}.tsx`]

      if (page.default.layout === undefined) {
        page.default.layout = (page: ReactNode) => <AppShell children={page} />
      }

      return page
    },
    setup: ({ App, props }) => <App {...props} />,
  })
}
