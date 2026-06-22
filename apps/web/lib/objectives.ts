import type { MatchTimeline } from "@riftlens/riot-api"

const OBJECTIVE_TYPES = new Set(["DRAGON", "BARON_NASHOR", "RIFTHERALD"])
// Window around an enemy objective in which a death counts as "contesting a lost objective".
const BEFORE_MS = 30_000
const AFTER_MS = 45_000

export interface MatchObjectiveResult {
  deaths: number
  enemyObjectives: number
  deathsNearLostObjective: number
}

/** Per-match: player deaths, enemy elite objectives, and deaths that fall in the
 * window around an objective the enemy took. */
export function analyzeMatchObjectives(
  tl: MatchTimeline,
  puuid: string
): MatchObjectiveResult | null {
  const idx = tl.metadata.participants.indexOf(puuid)
  if (idx < 0) return null
  const pid = idx + 1
  const teamId = pid <= 5 ? 100 : 200

  const deaths: number[] = []
  const enemyObjectives: number[] = []
  for (const frame of tl.info.frames) {
    for (const e of frame.events) {
      if (e.type === "CHAMPION_KILL" && e.victimId === pid) {
        deaths.push(e.timestamp)
      } else if (
        e.type === "ELITE_MONSTER_KILL" &&
        e.monsterType &&
        OBJECTIVE_TYPES.has(e.monsterType) &&
        e.killerTeamId != null &&
        e.killerTeamId !== teamId
      ) {
        enemyObjectives.push(e.timestamp)
      }
    }
  }

  let near = 0
  for (const d of deaths) {
    if (enemyObjectives.some((o) => d >= o - BEFORE_MS && d <= o + AFTER_MS)) near++
  }
  return {
    deaths: deaths.length,
    enemyObjectives: enemyObjectives.length,
    deathsNearLostObjective: near,
  }
}

export interface ObjectiveSummary {
  games: number
  deaths: number
  enemyObjectives: number
  deathsNearLostObjective: number
  /** share of deaths that happen around a lost objective (0..1) */
  ratio: number
  severity: "good" | "warn" | "bad"
}

export function summarizeObjectives(results: MatchObjectiveResult[]): ObjectiveSummary | null {
  if (results.length === 0) return null
  let deaths = 0
  let enemyObjectives = 0
  let near = 0
  for (const r of results) {
    deaths += r.deaths
    enemyObjectives += r.enemyObjectives
    near += r.deathsNearLostObjective
  }
  const ratio = deaths > 0 ? near / deaths : 0
  const severity = ratio >= 0.3 ? "bad" : ratio >= 0.15 ? "warn" : "good"
  return {
    games: results.length,
    deaths,
    enemyObjectives,
    deathsNearLostObjective: near,
    ratio,
    severity,
  }
}
