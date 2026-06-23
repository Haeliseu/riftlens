import { headers } from "next/headers"
import { DEFAULT_LOCALE, type Locale, type TranslationKey, translate } from "./dictionaries"

/** Resolve the active locale from the path (set by middleware as `x-locale`). */
export async function getLocale(): Promise<Locale> {
  const fromHeader = (await headers()).get("x-locale")
  return fromHeader === "fr" || fromHeader === "en" ? fromHeader : DEFAULT_LOCALE
}

/** Server-side translator bound to the request locale. */
export async function getT(): Promise<
  (key: TranslationKey, vars?: Record<string, string | number>) => string
> {
  const locale = await getLocale()
  return (key, vars) => translate(locale, key, vars)
}
