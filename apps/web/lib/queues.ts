import type { TranslationKey } from "@/lib/i18n/dictionaries"

/**
 * Map a Riot queueId to a canonical dictionary key. Aliases (e.g. the several
 * ARAM / Arena / ARURF ids) resolve to the same label so modes never fall
 * through to "Other".
 */
const QUEUE_KEY: Record<number, TranslationKey> = {
  400: "queue.400", // Normal Draft
  420: "queue.420", // Ranked Solo/Duo
  430: "queue.430", // Normal Blind
  440: "queue.440", // Ranked Flex
  450: "queue.450", // ARAM
  490: "queue.490", // Quickplay
  480: "queue.480", // Swiftplay
  700: "queue.700", // Clash
  720: "queue.720", // ARAM Clash
  830: "queue.bots", // Co-op vs AI (intro)
  840: "queue.bots",
  850: "queue.bots",
  870: "queue.bots",
  880: "queue.bots",
  890: "queue.bots",
  900: "queue.900", // ARURF
  1010: "queue.900", // Snow ARURF
  1020: "queue.1020", // One for All
  1300: "queue.1300", // Nexus Blitz
  1400: "queue.1400", // Ultimate Spellbook
  1700: "queue.1700", // Arena
  1710: "queue.1700", // Arena (alt)
  1900: "queue.1900", // URF
  2300: "queue.2300", // Brawl
}

/**
 * Match-v5 `gameMode` → dictionary key. Used as a fallback when the queueId
 * isn't in our table (new/variant ids), since gameMode is stable + descriptive.
 */
const MODE_KEY: Record<string, TranslationKey> = {
  ARAM: "queue.450",
  CHERRY: "queue.1700", // Arena
  URF: "queue.1900",
  ARURF: "queue.900",
  ONEFORALL: "queue.1020",
  NEXUSBLITZ: "queue.1300",
  ULTBOOK: "queue.1400",
  BRAWL: "queue.2300",
}

/**
 * Localized queue label. Prefers the precise queueId mapping, then the
 * gameMode fallback, then "other".
 */
export function queueKey(
  queueId: number | null | undefined,
  gameMode?: string | null
): TranslationKey {
  const byId = queueId != null ? QUEUE_KEY[queueId] : undefined
  if (byId) return byId
  const byMode = gameMode ? MODE_KEY[gameMode.toUpperCase()] : undefined
  if (byMode) return byMode
  return "queue.other"
}
