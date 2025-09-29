'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'
import { useLanguagePersistence } from '@/hooks/use-language-persistence'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { currentLanguage, saveLanguagePreference } = useLanguagePersistence()

  const handleLanguageChange = (locale: string) => {
    saveLanguagePreference(locale)
  }

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4" />
      <Select
        value={currentLanguage}
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            🇺🇸 {t('language.english')}
          </SelectItem>
          <SelectItem value="es">
            🇪🇸 {t('language.spanish')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
