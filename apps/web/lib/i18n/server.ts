import { cookies } from "next/headers"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  type Locale,
  type TranslationKey,
  translate,
} from "./dictionaries"

/** Resolve the active locale from the request cookie (server components). */
export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value as Locale | undefined
  return stored && LOCALES.includes(stored) ? stored : DEFAULT_LOCALE
}

/** Server-side translator bound to the request locale. */
export async function getT(): Promise<
  (key: TranslationKey, vars?: Record<string, string | number>) => string
> {
  const locale = await getLocale()
  return (key, vars) => translate(locale, key, vars)
}
