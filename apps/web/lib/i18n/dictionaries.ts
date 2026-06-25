import { en } from "./locales/en"
import { fr } from "./locales/fr"

export type Locale = "fr" | "en"

export const LOCALES: Locale[] = ["en", "fr"]
export const DEFAULT_LOCALE: Locale = "en"
export const LOCALE_COOKIE = "riftlens-locale"

/**
 * Flat, namespaced translation keys. Every user-facing string lives here so the
 * UI is fully French OR fully English — never mixed. Use `{var}` placeholders
 * for interpolation (see the `t` helper).
 *
 * The locale tables themselves live in `./locales/fr.ts` and `./locales/en.ts`.
 */
export const dictionaries = {
  fr,
  en,
} as const

export type TranslationKey = keyof (typeof dictionaries)["fr"]

/** Locale-aware translation usable from both server and client code. */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const table = dictionaries[locale] as Record<string, string>
  const fallback = dictionaries[DEFAULT_LOCALE] as Record<string, string>
  const template = table[key] ?? fallback[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}
