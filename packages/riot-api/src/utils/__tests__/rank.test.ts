import { describe, expect, it } from "vitest"
import { computeAverageGameRank, getRankIconUrl, lpToTier, tierToLP } from "../rank"

describe("Rank utilities", () => {
  it("tierToLP converts Diamond II 50LP correctly", () => {
    // Diamond base = 2400, II offset = 200, + 50 LP = 2650
    expect(tierToLP("Diamond", "II", 50)).toBe(2650)
  })

  it("lpToTier round-trips tierToLP", () => {
    const original = { tier: "Diamond" as const, division: "II" as const, lp: 50 }
    const value = tierToLP(original.tier, original.division, original.lp)
    const result = lpToTier(value)
    expect(result.tier).toBe(original.tier)
    expect(result.division).toBe(original.division)
    expect(result.lp).toBe(original.lp)
  })

  it("computeAverageGameRank returns median not mean", () => {
    // 3 players: Iron IV 0, Diamond I 99, Iron IV 0
    // Sorted: [0, 0, 2799], median index 1 → value 0 → Iron IV
    const ranks = [
      { tier: "Diamond" as const, division: "I" as const, leaguePoints: 99 },
      { tier: "Iron" as const, division: "IV" as const, leaguePoints: 0 },
      { tier: "Iron" as const, division: "IV" as const, leaguePoints: 0 },
    ]
    const result = computeAverageGameRank(ranks)
    expect(result.tier).toBe("Iron")
    expect(result.division).toBe("IV")
  })

  it("computeAverageGameRank handles Master+ correctly", () => {
    const ranks = [
      { tier: "Master" as const, division: "I" as const, leaguePoints: 500 },
      { tier: "Grandmaster" as const, division: "I" as const, leaguePoints: 200 },
      { tier: "Challenger" as const, division: "I" as const, leaguePoints: 800 },
    ]
    const result = computeAverageGameRank(ranks)
    // All are very high — result should be Master or above
    expect(["Master", "Grandmaster", "Challenger"]).toContain(result.tier)
  })

  it("computeAverageGameRank returns default when empty", () => {
    const result = computeAverageGameRank([])
    expect(result.tier).toBe("Gold")
    expect(result.division).toBe("IV")
  })

  it("getRankIconUrl returns valid URL format", () => {
    const url = getRankIconUrl("Diamond")
    expect(url).toContain("raw.communitydragon.org")
    expect(url).toContain("diamond")
    expect(url).toMatch(/^https:\/\//)
  })
})
