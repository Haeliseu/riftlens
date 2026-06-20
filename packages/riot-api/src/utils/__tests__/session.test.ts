import { describe, expect, it, vi } from "vitest"
import { SEASON_2_2026_START_MS } from "../season"
import { computeSessionStats } from "../session"

const PUUID = "test-puuid"
const NOW_MS = SEASON_2_2026_START_MS + 86400000 * 30 // 30 days into season

function todayMs() {
  const d = new Date(NOW_MS)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

describe("Session stats", () => {
  it("computeSessionStats only counts today matches", () => {
    const today = todayMs()
    const matches = [
      { gameCreation: today + 3600000, win: true, puuid: PUUID }, // today
      { gameCreation: today - 86400000, win: true, puuid: PUUID }, // yesterday
    ]
    vi.setSystemTime(new Date(NOW_MS))
    const result = computeSessionStats(matches, PUUID)
    expect(result.gamesPlayed).toBe(1)
    vi.useRealTimers()
  })

  it("computeSessionStats filters to current season", () => {
    vi.setSystemTime(new Date(NOW_MS))
    const today = todayMs()
    const matches = [
      { gameCreation: today + 1000, win: true, puuid: PUUID }, // today, current season
      { gameCreation: 1700000000000, win: true, puuid: PUUID }, // old season, fake "today" — won't pass season filter
    ]
    const result = computeSessionStats(matches, PUUID)
    expect(result.gamesPlayed).toBe(1)
    vi.useRealTimers()
  })

  it("streak is positive for consecutive wins", () => {
    vi.setSystemTime(new Date(NOW_MS))
    const today = todayMs()
    const matches = [
      { gameCreation: today + 3000, win: true, puuid: PUUID },
      { gameCreation: today + 2000, win: true, puuid: PUUID },
      { gameCreation: today + 1000, win: true, puuid: PUUID },
    ]
    const result = computeSessionStats(matches, PUUID)
    expect(result.streak).toBe(3)
    vi.useRealTimers()
  })

  it("streak is negative for consecutive losses", () => {
    vi.setSystemTime(new Date(NOW_MS))
    const today = todayMs()
    const matches = [
      { gameCreation: today + 3000, win: false, puuid: PUUID },
      { gameCreation: today + 2000, win: false, puuid: PUUID },
      { gameCreation: today + 1000, win: false, puuid: PUUID },
    ]
    const result = computeSessionStats(matches, PUUID)
    expect(result.streak).toBe(-3)
    vi.useRealTimers()
  })

  it("empty session returns zeros", () => {
    vi.setSystemTime(new Date(NOW_MS))
    const result = computeSessionStats([], PUUID)
    expect(result).toEqual({ wins: 0, losses: 0, winRate: 0, gamesPlayed: 0, streak: 0 })
    vi.useRealTimers()
  })
})
