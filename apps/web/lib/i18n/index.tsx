"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import {
  DEFAULT_LOCALE,
  dictionaries,
  LOCALE_COOKIE,
  type Locale,
  type TranslationKey,
} from "./dictionaries"

type Vars = Record<string, string | number>

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale) => void
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

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof document !== "undefined") {
      document.documentElement.lang = l
      // biome-ignore lint/suspicious/noDocumentCookie: simple locale cookie; cookieStore isn't universally available
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const table = dictionaries[locale] as Record<string, string>
      const fallback = dictionaries[DEFAULT_LOCALE] as Record<string, string>
      return interpolate(table[key] ?? fallback[key] ?? key, vars)
    },
    [locale]
  )

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider")
  return ctx
}

export { LOCALES, type Locale } from "./dictionaries"
