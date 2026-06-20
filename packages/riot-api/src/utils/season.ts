// Season 2 2026 started April 29, 2026
// Act 2 "Pandemonium" started ~May 13, 2026
// Never aggregate with Season 1 2026 (started Jan 8, 2026)
export const SEASON_2_2026_START_MS = 1777420800000 // 2026-04-29T00:00:00Z

export const CURRENT_SEASON_LABEL = "Saison 2 2026"
export const CURRENT_SEASON_START_DATE = "29 avr. 2026"

export function isCurrentSeason(gameCreationMs: number): boolean {
  return gameCreationMs >= SEASON_2_2026_START_MS
}

export function filterCurrentSeason<T extends { gameCreation: number }>(items: T[]): T[] {
  return items.filter((item) => isCurrentSeason(item.gameCreation))
}
