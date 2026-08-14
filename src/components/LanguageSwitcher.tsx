'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { useTransition } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const [isPending, startTransition] = useTransition()

  const toggleLanguage = () => {
    const nextLocale = locale === 'de' ? 'en' : 'de'
    startTransition(() => {
      router.push(pathname, { locale: nextLocale })
    })
  }

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="btn btn-ghost"
      style={{ fontSize: 11, padding: '4px 10px', marginLeft: 'auto', opacity: isPending ? 0.6 : 1 }}
      title={t('toggleLanguage')}
      aria-label={t('toggleLanguage')}
    >
      {locale === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
