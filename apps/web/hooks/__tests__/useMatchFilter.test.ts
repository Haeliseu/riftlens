import { SEASON_2_2026_START_MS } from "@riftlens/riot-api"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useMatchFilter } from "../useMatchFilter"

const NOW = SEASON_2_2026_START_MS + 30 * 86400000
const TODAY_START = new Date(NOW)
TODAY_START.setHours(0, 0, 0, 0)

const matches = [
  {
    gameCreation: TODAY_START.getTime() + 1000,
    win: true,
    participantTeamId: 100,
    opponentTeamId: 100,
    opponentPuuid: "ally-puuid",
  },
  {
    gameCreation: TODAY_START.getTime() - 86400000, // yesterday
    win: false,
    participantTeamId: 100,
    opponentTeamId: 200,
    opponentPuuid: "enemy-puuid",
  },
  {
    gameCreation: SEASON_2_2026_START_MS - 1, // before season
    win: true,
    participantTeamId: 100,
    opponentTeamId: 200,
    opponentPuuid: "old-puuid",
  },
]

describe("useMatchFilter", () => {
  it("filters by 'day' to today only", () => {
    vi.setSystemTime(new Date(NOW))
    const { result } = renderHook(() => useMatchFilter(matches, { period: "day" }))
    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.gameCreation).toBeGreaterThanOrEqual(TODAY_START.getTime())
    vi.useRealTimers()
  })

  it("filters by 'session' to current season + today", () => {
    vi.setSystemTime(new Date(NOW))
    const { result } = renderHook(() => useMatchFilter(matches, { period: "session" }))
    // Only today + season
    expect(result.current.every((m) => m.gameCreation >= SEASON_2_2026_START_MS)).toBe(true)
    vi.useRealTimers()
  })

  it("filters by opponentPuuid when provided", () => {
    const { result } = renderHook(() =>
      useMatchFilter(matches, { period: "all", opponentPuuid: "ally-puuid" })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.opponentPuuid).toBe("ally-puuid")
  })

  it("sub-filters ally vs enemy correctly", () => {
    const { result: allyResult } = renderHook(() =>
      useMatchFilter(matches, {
        period: "all",
        opponentPuuid: "ally-puuid",
        opponentRelation: "ally",
      })
    )
    expect(allyResult.current).toHaveLength(1)
    expect(allyResult.current[0]?.participantTeamId).toBe(allyResult.current[0]?.opponentTeamId)
  })

  it("sub-filters enemy relation correctly", () => {
    const { result } = renderHook(() =>
      useMatchFilter(matches, {
        period: "all",
        opponentPuuid: "enemy-puuid",
        opponentRelation: "enemy",
      })
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.participantTeamId).not.toBe(result.current[0]?.opponentTeamId)
  })

  it("opponentRelation 'both' skips team filter", () => {
    const { result } = renderHook(() =>
      useMatchFilter(matches, {
        period: "all",
        opponentPuuid: "ally-puuid",
        opponentRelation: "both",
      })
    )
    expect(result.current).toHaveLength(1)
  })

  it("returns all matches with period 'all' and no filters", () => {
    const { result } = renderHook(() => useMatchFilter(matches, { period: "all" }))
    expect(result.current).toHaveLength(3)
  })

  it("combines period and opponent filters", () => {
    vi.setSystemTime(new Date(NOW))
    const { result } = renderHook(() =>
      useMatchFilter(matches, { period: "day", opponentPuuid: "ally-puuid" })
    )
    expect(result.current).toHaveLength(1)
    vi.useRealTimers()
  })
})
