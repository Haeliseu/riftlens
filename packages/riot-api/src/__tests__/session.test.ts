import { describe, expect, it } from "vitest"
import { computeSessionStats } from "../utils/session"

const NOW = Date.now()
const TODAY_START = new Date(NOW)
TODAY_START.setHours(0, 0, 0, 0)
const DAY_MS = TODAY_START.getTime()

function match(win: boolean, offsetMs = 0) {
  return { gameCreation: DAY_MS + 3_600_000 + offsetMs, win, puuid: "me" }
}

describe("computeSessionStats", () => {
  it("returns zero stats when no matches", () => {
    const result = computeSessionStats([], "me")
    expect(result).toEqual({ wins: 0, losses: 0, winRate: 0, gamesPlayed: 0, streak: 0 })
  })

  it("counts wins and losses correctly", () => {
    const result = computeSessionStats([match(true), match(false), match(true)], "me")
    expect(result.wins).toBe(2)
    expect(result.losses).toBe(1)
    expect(result.gamesPlayed).toBe(3)
  })

  it("computes win rate as percentage", () => {
    const result = computeSessionStats([match(true), match(false)], "me")
    expect(result.winRate).toBe(50)
  })

  it("computes positive streak for consecutive wins", () => {
    const result = computeSessionStats(
      [match(true, 3000), match(true, 2000), match(true, 1000)],
      "me"
    )
    expect(result.streak).toBe(3)
  })

  it("computes negative streak for consecutive losses", () => {
    const result = computeSessionStats([match(false, 2000), match(false, 1000)], "me")
    expect(result.streak).toBe(-2)
  })

  it("breaks streak on W,W,L pattern (streak=2, stops at L)", () => {
    // Sorted desc by gameCreation: [W(3000), W(2000), L(1000)]
    const result = computeSessionStats(
      [match(true, 3000), match(true, 2000), match(false, 1000)],
      "me"
    )
    expect(result.streak).toBe(2)
  })

  it("ignores matches from other puuids", () => {
    const other = { gameCreation: DAY_MS + 3_600_000, win: true, puuid: "other" }
    const result = computeSessionStats([other], "me")
    expect(result.gamesPlayed).toBe(0)
  })

  it("ignores matches before today", () => {
    const yesterday = { gameCreation: DAY_MS - 1000, win: true, puuid: "me" }
    const result = computeSessionStats([yesterday], "me")
    expect(result.gamesPlayed).toBe(0)
  })
})
