import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Translation resources
const resources = {
  en: {
    common: require('../public/locales/en/common.json')
  },
  es: {
    common: require('../public/locales/es/common.json')
  }
}

// Initialize i18n only on the client side
if (typeof window !== 'undefined') {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: typeof window !== 'undefined' ? localStorage.getItem('language-preferences') || 'en' : 'en',
      fallbackLng: 'en',
      debug: false,
      
      interpolation: {
        escapeValue: false, // react already does escaping
      },
      
      defaultNS: 'common',
      react: {
        useSuspense: false, // prevent Suspense issues
      },
    })
} else {
  // Server-side initialization
  i18n.init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    react: {
      useSuspense: false,
    },
  })
}

export default i18n
