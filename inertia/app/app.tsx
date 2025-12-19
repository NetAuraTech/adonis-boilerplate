/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { ReactNode } from 'react'
import AppShell from '#components/layouts/app_shell'

import.meta.glob(['../assets/**/*'])

import '../assets/scss/app.scss'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

void createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  async resolve (name) {
    const page = await resolvePageComponent<any>(
      `../pages/${name}.tsx`,
      import.meta.glob('../pages/**/*.tsx'),
    )

    page.default.layout = page.default.layout || ((page: ReactNode) => <AppShell children={page} />)

    return page
  },

  setup({ el, App, props }) {
    const applicationTree = <App {...props} />

    //? Example to disable SSR for specific pages
    // if(props.initialPage.component.includes('xxx')) {
    //   createRoot(el).render(applicationTree)
    //   return
    // }

    hydrateRoot(el, applicationTree)
  },
});
