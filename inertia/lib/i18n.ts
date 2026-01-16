import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAdmin from '~/locales/en/admin.json'
import enAuth from '~/locales/en/auth.json'
import enProfile from '~/locales/en/profile.json'
import enCommon from '~/locales/en/common.json'
import enErrors from '~/locales/en/errors.json'
import enValidation from '~/locales/en/validation.json'
import enNotifications from '~/locales/en/notifications.json'

import frAdmin from '~/locales/fr/admin.json'
import frAuth from '~/locales/fr/auth.json'
import frProfile from '~/locales/fr/profile.json'
import frCommon from '~/locales/fr/common.json'
import frErrors from '~/locales/fr/errors.json'
import frValidation from '~/locales/fr/validation.json'
import frNotifications from '~/locales/fr/notifications.json'

const resources = {
  en: {
    admin: enAdmin,
    auth: enAuth,
    profile: enProfile,
    common: enCommon,
    errors: enErrors,
    validation: enValidation,
    notifications: enNotifications,
  },
  fr: {
    admin: frAdmin,
    auth: frAuth,
    profile: frProfile,
    common: frCommon,
    errors: frErrors,
    validation: frValidation,
    notifications: frNotifications,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['admin', 'auth', 'profile', 'common', 'errors', 'validation', 'notifications'],
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
    format: (value, format: 'long' | 'full' | 'medium' | 'short' | undefined, lng) => {
      if (value instanceof Date) {
        return new Intl.DateTimeFormat(lng, {
          dateStyle: format || 'long',
        }).format(value)
      }
      return value
    },
  },
  react: {
    useSuspense: false,
  },
})

export default i18n
