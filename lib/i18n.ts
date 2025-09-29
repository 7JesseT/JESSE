import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from '../public/locales/en/common.json'
import esTranslations from '../public/locales/es/common.json'

// Translation resources
const resources = {
  en: {
    common: enTranslations
  },
  es: {
    common: esTranslations
  }
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
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

export default i18n
