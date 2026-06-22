import { describe, expect, it } from "vitest"
import { analyzeCoaching } from "@/lib/coaching"
import type { CoachInput } from "@/lib/profile-db"

const mid: CoachInput = {
  role: "MIDDLE",
  games: 30,
  csPerMin: 8,
  kp: 0.62,
  deathsPerGame: 4,
  kda: 3,
  visionPerMin: 1,
  goldPerMin: 420,
  winRate: 55,
}

describe("analyzeCoaching", () => {
  it("grades a mid meeting benchmarks as all good", () => {
    const tips = analyzeCoaching(mid)
    expect(tips.every((t) => t.severity === "good")).toBe(true)
    expect(tips.map((t) => t.metric).sort()).toEqual(["csPerMin", "deaths", "gold", "kp"])
  })

  it("does NOT judge a support on CS or gold", () => {
    const sup: CoachInput = { ...mid, role: "UTILITY", csPerMin: 1, goldPerMin: 250 }
    const metrics = analyzeCoaching(sup).map((t) => t.metric)
    expect(metrics).not.toContain("csPerMin")
    expect(metrics).not.toContain("gold")
    expect(metrics).toContain("vision")
  })

  it("flags low CS/min as bad for a laner", () => {
    const tips = analyzeCoaching({ ...mid, csPerMin: 4 })
    expect(tips.find((t) => t.metric === "csPerMin")?.severity).toBe("bad")
  })

  it("flags excessive deaths as bad", () => {
    const deaths = analyzeCoaching({ ...mid, deathsPerGame: 9 }).find((t) => t.metric === "deaths")
    expect(deaths?.severity).toBe("bad")
    expect(deaths?.value).toBe(9)
  })

  it("renders KP as a rounded percentage and gold as an integer", () => {
    const tips = analyzeCoaching(mid)
    expect(tips.find((t) => t.metric === "kp")?.value).toBe(62)
    expect(tips.find((t) => t.metric === "gold")?.value).toBe(420)
  })

  it("falls back to MIDDLE metrics for an unknown role", () => {
    const metrics = analyzeCoaching({ ...mid, role: "UNKNOWN" }).map((t) => t.metric)
    expect(metrics).toContain("csPerMin")
  })
})
