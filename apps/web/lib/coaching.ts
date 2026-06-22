import type { CoachInput } from "@/lib/profile-db"

export type CoachMetric = "csPerMin" | "vision" | "kp" | "deaths"
export type CoachSeverity = "good" | "warn" | "bad"

export interface CoachTip {
  metric: CoachMetric
  severity: CoachSeverity
  /** the player's value, already rounded for display */
  value: number
  /** the role benchmark */
  target: number
}

/** Reasonable per-role baselines for a solid ranked player (higher = better,
 * except deaths). Tuned to be encouraging, not pro-level. */
const DEFAULT_BENCH: Record<CoachMetric, number> = {
  csPerMin: 7.5,
  vision: 28,
  kp: 0.6,
  deaths: 5,
}
const BENCH: Record<string, Record<CoachMetric, number>> = {
  TOP: { csPerMin: 7, vision: 25, kp: 0.5, deaths: 5 },
  JUNGLE: { csPerMin: 5.5, vision: 32, kp: 0.6, deaths: 5 },
  MIDDLE: DEFAULT_BENCH,
  BOTTOM: { csPerMin: 8, vision: 25, kp: 0.55, deaths: 5 },
  UTILITY: { csPerMin: 1.5, vision: 55, kp: 0.65, deaths: 5.5 },
}

function gradeHigher(value: number, target: number): CoachSeverity {
  const ratio = target > 0 ? value / target : 1
  if (ratio >= 0.95) return "good"
  if (ratio >= 0.8) return "warn"
  return "bad"
}

function gradeLower(value: number, target: number): CoachSeverity {
  if (value <= target) return "good"
  if (value <= target * 1.2) return "warn"
  return "bad"
}

const round = (n: number, d = 0) => {
  const f = 10 ** d
  return Math.round(n * f) / f
}

/** Compare the player's aggregates to their role's benchmarks → graded tips. */
export function analyzeCoaching(s: CoachInput): CoachTip[] {
  const b = BENCH[s.role] ?? DEFAULT_BENCH
  return [
    {
      metric: "csPerMin",
      value: round(s.csPerMin, 1),
      target: b.csPerMin,
      severity: gradeHigher(s.csPerMin, b.csPerMin),
    },
    {
      metric: "vision",
      value: round(s.visionPerGame),
      target: b.vision,
      severity: gradeHigher(s.visionPerGame, b.vision),
    },
    {
      metric: "kp",
      value: round(s.kp * 100),
      target: round(b.kp * 100),
      severity: gradeHigher(s.kp, b.kp),
    },
    {
      metric: "deaths",
      value: round(s.deathsPerGame, 1),
      target: b.deaths,
      severity: gradeLower(s.deathsPerGame, b.deaths),
    },
  ]
}
