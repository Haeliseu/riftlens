import type { CoachInput } from "@/lib/profile-db"

export type CoachMetric = "csPerMin" | "vision" | "kp" | "deaths" | "gold" | "dpm"
export type CoachSeverity = "good" | "warn" | "bad"

export interface CoachTip {
  metric: CoachMetric
  severity: CoachSeverity
  value: number // rounded for display
  target: number
}

/**
 * Per-rank benchmarks from LegendsTracker's published methodology (real data,
 * ~830k EUW games, calibrated 2026-03-23): CS/min, KP, DPM, gold/min, deaths.
 * https://legendstracker.fr/methodologie
 */
const RANK_BENCH: Record<
  string,
  { cs: number; kp: number; dpm: number; gold: number; deaths: number }
> = {
  IRON: { cs: 4.9, kp: 0.37, dpm: 544, gold: 350, deaths: 7.5 },
  BRONZE: { cs: 5.8, kp: 0.45, dpm: 698, gold: 401, deaths: 6.5 },
  SILVER: { cs: 6.6, kp: 0.46, dpm: 809, gold: 434, deaths: 6.4 },
  GOLD: { cs: 6.8, kp: 0.46, dpm: 739, gold: 428, deaths: 6.4 },
  PLATINUM: { cs: 7.1, kp: 0.46, dpm: 763, gold: 438, deaths: 6.4 },
  EMERALD: { cs: 7.6, kp: 0.47, dpm: 774, gold: 454, deaths: 6.2 },
  DIAMOND: { cs: 7.6, kp: 0.48, dpm: 760, gold: 452, deaths: 6.0 },
  MASTER: { cs: 7.7, kp: 0.48, dpm: 731, gold: 448, deaths: 5.8 },
  GRANDMASTER: { cs: 7.9, kp: 0.49, dpm: 762, gold: 457, deaths: 5.5 },
  CHALLENGER: { cs: 8.1, kp: 0.5, dpm: 798, gold: 466, deaths: 5.3 },
}
const DEFAULT_RANK = RANK_BENCH.EMERALD as (typeof RANK_BENCH)[string]
const VISION_BASE = 0.9 // base vision/min, scaled by the role multiplier

// Role equity multipliers (same source). Only the metrics relevant to the role
// are shown — e.g. a support is never judged on CS or gold.
const ROLE: Record<
  string,
  { metrics: CoachMetric[]; cs: number; vision: number; dpm: number; kp: number }
> = {
  TOP: {
    metrics: ["csPerMin", "gold", "dpm", "kp", "deaths"],
    cs: 1,
    vision: 0.8,
    dpm: 0.9,
    kp: 0.9,
  },
  JUNGLE: { metrics: ["kp", "vision", "dpm", "deaths"], cs: 0.75, vision: 1.3, dpm: 0.7, kp: 1.15 },
  MIDDLE: {
    metrics: ["csPerMin", "kp", "dpm", "gold", "deaths"],
    cs: 1,
    vision: 0.9,
    dpm: 1,
    kp: 1.05,
  },
  BOTTOM: {
    metrics: ["csPerMin", "dpm", "gold", "kp", "deaths"],
    cs: 1.1,
    vision: 0.8,
    dpm: 1.1,
    kp: 1.1,
  },
  UTILITY: { metrics: ["vision", "kp", "deaths"], cs: 0.25, vision: 2, dpm: 0.55, kp: 1.3 },
}
const DEFAULT_ROLE = ROLE.MIDDLE as (typeof ROLE)[string]

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

/** Target for a metric = rank benchmark × role multiplier. */
function target(
  metric: CoachMetric,
  rank: (typeof RANK_BENCH)[string],
  role: (typeof ROLE)[string]
) {
  switch (metric) {
    case "csPerMin":
      return rank.cs * role.cs
    case "vision":
      return VISION_BASE * role.vision
    case "kp":
      return Math.min(0.9, rank.kp * role.kp)
    case "dpm":
      return rank.dpm * role.dpm
    case "gold":
      return rank.gold
    case "deaths":
      return rank.deaths
  }
}

function rawValue(metric: CoachMetric, s: CoachInput): number {
  switch (metric) {
    case "csPerMin":
      return s.csPerMin
    case "vision":
      return s.visionPerMin
    case "kp":
      return s.kp
    case "deaths":
      return s.deathsPerGame
    case "gold":
      return s.goldPerMin
    case "dpm":
      return s.dpm
  }
}

function display(metric: CoachMetric, v: number): number {
  if (metric === "kp") return round(v * 100)
  if (metric === "gold" || metric === "dpm") return round(v)
  return round(v, 1)
}

/** Grade only the role's relevant metrics against its rank-scaled benchmarks. */
export function analyzeCoaching(s: CoachInput, tier?: string | null): CoachTip[] {
  const rank = RANK_BENCH[(tier ?? "").toUpperCase()] ?? DEFAULT_RANK
  const role = ROLE[s.role] ?? DEFAULT_ROLE
  return role.metrics.map((metric) => {
    const tgt = target(metric, rank, role)
    const raw = rawValue(metric, s)
    const severity = metric === "deaths" ? gradeLower(raw, tgt) : gradeHigher(raw, tgt)
    return { metric, severity, value: display(metric, raw), target: display(metric, tgt) }
  })
}
