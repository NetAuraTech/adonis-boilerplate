/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { ReactNode } from 'react'
import AppShell from '#components/layouts/app_shell'
import AdminShell from '~/components/layouts/admin/admin_shell'
import i18n from '~/lib/i18n'

import '../assets/scss/app.scss'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

void createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  async resolve(name) {
    const page = await resolvePageComponent<any>(
      `../pages/${name}.tsx`,
      import.meta.glob('../pages/**/*.tsx')
    )

    page.default.layout = page.default.layout || ((page: ReactNode) => {
      if (name.startsWith('admin/')) {
        return <AdminShell children={page} />
      }

      return <AppShell children={page} />
    })

    return page
  },

  setup({ el, App, props }) {
    const locale = String(props.initialPage.props.locale || 'en')
    i18n.changeLanguage(locale)

    const applicationTree = <App {...props} />

    hydrateRoot(el, applicationTree)
  },
})
