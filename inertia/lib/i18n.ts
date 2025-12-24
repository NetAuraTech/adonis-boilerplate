import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from '~/locales/en/auth.json'
import enProfile from '~/locales/en/profile.json'
import enCommon from '~/locales/en/common.json'
import enErrors from '~/locales/en/errors.json'
import enValidation from '~/locales/en/validation.json'

import frAuth from '~/locales/fr/auth.json'
import frProfile from '~/locales/fr/profile.json'
import frCommon from '~/locales/fr/common.json'
import frErrors from '~/locales/fr/errors.json'
import frValidation from '~/locales/fr/validation.json'

const resources = {
  en: {
    auth: enAuth,
    profile: enProfile,
    common: enCommon,
    errors: enErrors,
    validation: enValidation,
  },
  fr: {
    auth: frAuth,
    profile: frProfile,
    common: frCommon,
    errors: frErrors,
    validation: frValidation,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['auth', 'profile', 'common', 'errors', 'validation'],
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
  },
  react: {
    useSuspense: false,
  },
})

export default i18n
