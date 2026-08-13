'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLanguage = () => {
    const nextLocale = locale === 'de' ? 'en' : 'de'
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-ghost"
      style={{ fontSize: 11, padding: '4px 10px', marginLeft: 'auto' }}
      title="Toggle Language"
    >
      {locale === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
