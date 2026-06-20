import { describe, expect, it } from "vitest"
import { filterCurrentSeason, isCurrentSeason, SEASON_2_2026_START_MS } from "../season"

describe("Season filtering", () => {
  it("SEASON_2_2026_START_MS equals 2026-04-29T00:00:00Z", () => {
    expect(new Date(SEASON_2_2026_START_MS).toISOString()).toBe("2026-04-29T00:00:00.000Z")
  })

  it("rejects matches before season 2 2026", () => {
    // Season 1 2026 match (Feb 2026)
    expect(isCurrentSeason(1740787200000)).toBe(false)
  })

  it("accepts matches on and after April 29 2026", () => {
    expect(isCurrentSeason(SEASON_2_2026_START_MS)).toBe(true)
    expect(isCurrentSeason(SEASON_2_2026_START_MS + 1)).toBe(true)
  })

  it("filterCurrentSeason removes old season data", () => {
    const items = [
      { gameCreation: 1740787200000 }, // Season 1 — filtered out
      { gameCreation: SEASON_2_2026_START_MS }, // Season 2 — kept
      { gameCreation: SEASON_2_2026_START_MS + 86400000 }, // Season 2 — kept
    ]
    const result = filterCurrentSeason(items)
    expect(result).toHaveLength(2)
    expect(result.every((i) => i.gameCreation >= SEASON_2_2026_START_MS)).toBe(true)
  })
})
