import { DEFAULT_LOCALE, type Locale } from "./dictionaries"

/**
 * Prefix an internal path with its locale segment. The default locale (English)
 * lives at the root with no prefix; other locales get a `/<locale>` prefix.
 *   localePath("en", "/leaderboard") → "/leaderboard"
 *   localePath("fr", "/leaderboard") → "/fr/leaderboard"
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/")) return path
  return path === "/" ? `/${locale}` : `/${locale}${path}`
}

/** Metadata `alternates` (canonical + hreflang languages) for a route. */
export function localeAlternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: {
      en: path,
      fr: localePath("fr", path),
      "x-default": path,
    } as Record<string, string>,
  }
}
