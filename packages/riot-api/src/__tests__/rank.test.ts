import { describe, expect, it } from "vitest"
import { computeAverageGameRank, lpToTier, tierToLP } from "../utils/rank"

describe("tierToLP", () => {
  it("converts Diamond III 80 to correct LP value", () => {
    // Diamond base=2400, III offset=100, lp=80 → 2580
    expect(tierToLP("Diamond", "III", 80)).toBe(2580)
  })

  it("converts Iron IV 0 to 0", () => {
    expect(tierToLP("Iron", "IV", 0)).toBe(0)
  })

  it("converts Challenger I 100 to 4000", () => {
    // Challenger base=3600, I offset=300, lp=100 → 4000
    expect(tierToLP("Challenger", "I", 100)).toBe(4000)
  })
})

describe("lpToTier", () => {
  it("converts 2580 to Diamond III 80", () => {
    // 2580 - 2400(Diamond) = 180, floor(180/100)=1 → III, lp=80
    expect(lpToTier(2580)).toEqual({ tier: "Diamond", division: "III", lp: 80 })
  })

  it("converts 0 to Iron IV 0", () => {
    expect(lpToTier(0)).toEqual({ tier: "Iron", division: "IV", lp: 0 })
  })

  it("returns Iron IV 0 for negative value", () => {
    expect(lpToTier(-1)).toEqual({ tier: "Iron", division: "IV", lp: 0 })
  })

  it("converts 2800 to Master IV 0", () => {
    const result = lpToTier(2800)
    expect(result.tier).toBe("Master")
    expect(result.division).toBe("IV")
    expect(result.lp).toBe(0)
  })
})

describe("computeAverageGameRank", () => {
  it("returns Gold IV when no participants", () => {
    expect(computeAverageGameRank([])).toEqual({ tier: "Gold", division: "IV" })
  })

  it("returns median rank for participant list", () => {
    const result = computeAverageGameRank([
      { tier: "Silver", division: "I", leaguePoints: 50 },
      { tier: "Gold", division: "II", leaguePoints: 0 },
      { tier: "Platinum", division: "IV", leaguePoints: 20 },
    ])
    expect(result.tier).toBe("Gold")
  })
})
