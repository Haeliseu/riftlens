import { describe, expect, it } from "vitest"
import { analyzeCoaching } from "@/lib/coaching"
import type { CoachInput } from "@/lib/profile-db"

// A Diamond mid hitting Diamond benchmarks (cs 7.6, kp .48, dpm 760, gold 452, deaths 6).
const mid: CoachInput = {
  role: "MIDDLE",
  games: 30,
  csPerMin: 7.6,
  kp: 0.5,
  deathsPerGame: 5,
  kda: 3,
  visionPerMin: 0.9,
  goldPerMin: 460,
  dpm: 780,
  winRate: 55,
}

describe("analyzeCoaching", () => {
  it("grades a mid meeting Diamond benchmarks as all good", () => {
    const tips = analyzeCoaching(mid, "DIAMOND")
    expect(tips.every((t) => t.severity === "good")).toBe(true)
    expect(tips.map((t) => t.metric).sort()).toEqual(["csPerMin", "deaths", "dpm", "gold", "kp"])
  })

  it("does NOT judge a support on CS or gold", () => {
    const sup: CoachInput = { ...mid, role: "UTILITY", csPerMin: 1, goldPerMin: 250 }
    const metrics = analyzeCoaching(sup, "DIAMOND").map((t) => t.metric)
    expect(metrics).not.toContain("csPerMin")
    expect(metrics).not.toContain("gold")
    expect(metrics).toContain("vision")
  })

  it("scales the benchmark to the player's rank (same stats: pass at Iron, fail at Challenger)", () => {
    const weak = { ...mid, csPerMin: 5 }
    expect(analyzeCoaching(weak, "IRON").find((t) => t.metric === "csPerMin")?.severity).toBe("good")
    expect(analyzeCoaching(weak, "CHALLENGER").find((t) => t.metric === "csPerMin")?.severity).toBe(
      "bad"
    )
  })

  it("flags excessive deaths as bad", () => {
    const deaths = analyzeCoaching({ ...mid, deathsPerGame: 12 }, "DIAMOND").find(
      (t) => t.metric === "deaths"
    )
    expect(deaths?.severity).toBe("bad")
    expect(deaths?.value).toBe(12)
  })

  it("renders KP as a rounded percentage", () => {
    expect(analyzeCoaching(mid, "DIAMOND").find((t) => t.metric === "kp")?.value).toBe(50)
  })

  it("defaults to Emerald benchmarks when the tier is unknown", () => {
    expect(analyzeCoaching(mid, null)).toHaveLength(5)
  })
})
