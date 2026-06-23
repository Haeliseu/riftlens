"use client"

import { usePathname } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo } from "react"
import { DEFAULT_LOCALE, dictionaries, type Locale, type TranslationKey } from "./dictionaries"

type Vars = Record<string, string | number>

interface I18nValue {
  locale: Locale
  t: (key: TranslationKey, vars?: Vars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}

/**
 * Locale is derived from the URL (English at the root, French under /fr) so it
 * stays in sync with path-based routing. A `locale` override is accepted for
 * tests where there's no router.
 */
export function I18nProvider({
  children,
  locale: forced,
}: {
  children: React.ReactNode
  locale?: Locale
}) {
  const pathname = usePathname()
  const locale: Locale = forced ?? (pathname?.startsWith("/fr") ? "fr" : DEFAULT_LOCALE)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const table = dictionaries[locale] as Record<string, string>
      const fallback = dictionaries[DEFAULT_LOCALE] as Record<string, string>
      return interpolate(table[key] ?? fallback[key] ?? key, vars)
    },
    [locale]
  )

  const value = useMemo<I18nValue>(() => ({ locale, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider")
  return ctx
}

export { LOCALES, type Locale } from "./dictionaries"
