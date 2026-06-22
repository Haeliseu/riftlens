import type { MatchTimeline } from "@riftlens/riot-api"
import { describe, expect, it } from "vitest"
import { analyzeMatchObjectives, summarizeObjectives } from "@/lib/objectives"

// Player is participant 1 (puuid "me") → team 100. Enemy = team 200.
function tl(events: { type: string; timestamp: number; [k: string]: unknown }[]): MatchTimeline {
  return {
    metadata: { matchId: "M1", participants: ["me", "p2", "p3", "p4", "p5", "e6"] },
    info: { frames: [{ events }] },
  } as unknown as MatchTimeline
}

describe("analyzeMatchObjectives", () => {
  it("counts a death within the window of an enemy dragon", () => {
    const r = analyzeMatchObjectives(
      tl([
        {
          type: "ELITE_MONSTER_KILL",
          timestamp: 600_000,
          monsterType: "DRAGON",
          killerTeamId: 200,
        },
        { type: "CHAMPION_KILL", timestamp: 610_000, victimId: 1 }, // 10s after → counts
      ]),
      "me"
    )
    expect(r).toEqual({ deaths: 1, enemyObjectives: 1, deathsNearLostObjective: 1 })
  })

  it("does not count a death far from any objective", () => {
    const r = analyzeMatchObjectives(
      tl([
        {
          type: "ELITE_MONSTER_KILL",
          timestamp: 600_000,
          monsterType: "DRAGON",
          killerTeamId: 200,
        },
        { type: "CHAMPION_KILL", timestamp: 800_000, victimId: 1 }, // 200s later
      ]),
      "me"
    )
    expect(r?.deathsNearLostObjective).toBe(0)
  })

  it("ignores objectives the player's own team takes", () => {
    const r = analyzeMatchObjectives(
      tl([
        {
          type: "ELITE_MONSTER_KILL",
          timestamp: 600_000,
          monsterType: "DRAGON",
          killerTeamId: 100,
        },
        { type: "CHAMPION_KILL", timestamp: 605_000, victimId: 1 },
      ]),
      "me"
    )
    expect(r).toEqual({ deaths: 1, enemyObjectives: 0, deathsNearLostObjective: 0 })
  })

  it("returns null when the player isn't in the match", () => {
    expect(analyzeMatchObjectives(tl([]), "someone-else")).toBeNull()
  })
})

describe("summarizeObjectives", () => {
  it("grades a high ratio as bad", () => {
    const s = summarizeObjectives([{ deaths: 10, enemyObjectives: 5, deathsNearLostObjective: 4 }])
    expect(s?.severity).toBe("bad")
    expect(s?.ratio).toBeCloseTo(0.4)
  })

  it("grades a low ratio as good", () => {
    const s = summarizeObjectives([{ deaths: 10, enemyObjectives: 5, deathsNearLostObjective: 1 }])
    expect(s?.severity).toBe("good")
  })

  it("returns null with no results", () => {
    expect(summarizeObjectives([])).toBeNull()
  })
})
