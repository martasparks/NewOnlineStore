'use client'

import { useRouter, usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { Button } from './ui/button'

const languages = [
  { code: 'lv', label: 'LV', flag: '🇱🇻' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' }
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex items-center space-x-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={locale === lang.code ? "default" : "ghost"}
          size="sm"
          onClick={() => handleLanguageChange(lang.code)}
          className="text-xs"
        >
          {lang.flag} {lang.label}
        </Button>
      ))}
    </div>
  )
}
