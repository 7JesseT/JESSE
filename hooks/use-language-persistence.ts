import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function useLanguagePersistence() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('language-preferences')
    
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage)
    }
  }, [i18n])

  const saveLanguagePreference = (language: string) => {
    localStorage.setItem('language-preferences', language)
    i18n.changeLanguage(language)
  }

  return {
    currentLanguage: i18n.language,
    saveLanguagePreference,
    changeLanguage: i18n.changeLanguage,
    t: i18n.t,
  }
}
