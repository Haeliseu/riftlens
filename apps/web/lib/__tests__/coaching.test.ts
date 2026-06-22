import { describe, expect, it } from "vitest"
import { analyzeCoaching } from "@/lib/coaching"
import type { CoachInput } from "@/lib/profile-db"

const base: CoachInput = {
  role: "MIDDLE",
  games: 30,
  csPerMin: 7.5,
  kp: 0.6,
  deathsPerGame: 4,
  kda: 3,
  visionPerGame: 28,
  winRate: 55,
}

describe("analyzeCoaching", () => {
  it("returns one tip per tracked metric", () => {
    const tips = analyzeCoaching(base)
    expect(tips.map((t) => t.metric).sort()).toEqual(["csPerMin", "deaths", "kp", "vision"])
  })

  it("grades a player meeting benchmarks as good", () => {
    const tips = analyzeCoaching(base)
    expect(tips.every((t) => t.severity === "good")).toBe(true)
  })

  it("flags low CS/min as bad", () => {
    const tips = analyzeCoaching({ ...base, csPerMin: 4 })
    expect(tips.find((t) => t.metric === "csPerMin")?.severity).toBe("bad")
  })

  it("flags excessive deaths as bad and keeps deaths benchmark direction", () => {
    const tips = analyzeCoaching({ ...base, deathsPerGame: 9 })
    const deaths = tips.find((t) => t.metric === "deaths")
    expect(deaths?.severity).toBe("bad")
    expect(deaths?.value).toBe(9)
  })

  it("renders KP as a rounded percentage value", () => {
    const tips = analyzeCoaching({ ...base, kp: 0.6 })
    expect(tips.find((t) => t.metric === "kp")?.value).toBe(60)
  })

  it("falls back to MIDDLE benchmarks for an unknown role", () => {
    const tips = analyzeCoaching({ ...base, role: "UNKNOWN" })
    expect(tips).toHaveLength(4)
  })
})
