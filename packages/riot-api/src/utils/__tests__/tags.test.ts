import { describe, expect, it } from "vitest"
import type { SessionStats } from "../session"
import { computePlayerTags } from "../tags"

const baseSession: SessionStats = {
  wins: 0,
  losses: 0,
  winRate: 0,
  gamesPlayed: 0,
  streak: 0,
}

describe("Player tags", () => {
  it("detects on-fire at +3 streak", () => {
    const tags = computePlayerTags({
      session: { ...baseSession, streak: 3 },
      champWinRate: 45,
      champGames: 50,
      lastGameKDA: [2, 3, 4],
      recentChampGames: 10,
    })
    expect(tags).toContain("on-fire")
  })

  it("detects one-trick when >60% recent games on champion", () => {
    const tags = computePlayerTags({
      session: baseSession,
      champWinRate: 50,
      champGames: 25, // >= 20
      lastGameKDA: [2, 3, 4],
      recentChampGames: 20, // 20/30 = 66.7% >= 60%
    })
    expect(tags).toContain("one-trick")
  })

  it("detects carry-potential with high WR and KDA", () => {
    const tags = computePlayerTags({
      session: baseSession,
      champWinRate: 60, // >= 58
      champGames: 50,
      lastGameKDA: [8, 1, 5], // KDA = 13 >= 4.0
      recentChampGames: 10,
    })
    expect(tags).toContain("carry-potential")
  })

  it("never emits shaming tags (Riot policy)", () => {
    const tags = computePlayerTags({
      session: { ...baseSession, streak: -10 },
      champWinRate: 5,
      champGames: 2,
      lastGameKDA: [0, 15, 0],
      recentChampGames: 0,
    })
    expect(tags).toHaveLength(0)
  })

  it("can combine multiple honoring tags", () => {
    const tags = computePlayerTags({
      session: { ...baseSession, streak: 3 },
      champWinRate: 60,
      champGames: 10,
      lastGameKDA: [16, 0, 5], // fed-last-game (15+ kills) + carry-potential
      recentChampGames: 5,
    })
    expect(tags).toContain("on-fire")
    expect(tags).toContain("carry-potential")
    expect(tags).toContain("fed-last-game")
  })
})
