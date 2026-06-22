import type { CoachInput } from "@/lib/profile-db"

export type CoachMetric = "csPerMin" | "vision" | "kp" | "deaths" | "gold"
export type CoachSeverity = "good" | "warn" | "bad"

export interface CoachTip {
  metric: CoachMetric
  severity: CoachSeverity
  /** the player's value, already rounded for display */
  value: number
  /** the role benchmark */
  target: number
}

interface RoleConfig {
  /** metrics that actually matter for this role (a support isn't judged on CS) */
  metrics: CoachMetric[]
  bench: Partial<Record<CoachMetric, number>>
}

// Per-role baselines tuned around high-elo (Master+) play. Only the metrics that
// matter for the role are evaluated — e.g. no farm/gold pressure on supports.
const ROLES: Record<string, RoleConfig> = {
  TOP: {
    metrics: ["csPerMin", "gold", "kp", "deaths"],
    bench: { csPerMin: 7.5, gold: 400, kp: 0.55, deaths: 4.5 },
  },
  JUNGLE: {
    metrics: ["kp", "vision", "gold", "deaths"],
    bench: { kp: 0.65, vision: 1, gold: 380, deaths: 4.5 },
  },
  MIDDLE: {
    metrics: ["csPerMin", "kp", "gold", "deaths"],
    bench: { csPerMin: 8, kp: 0.62, gold: 420, deaths: 4.5 },
  },
  BOTTOM: {
    metrics: ["csPerMin", "gold", "kp", "deaths"],
    bench: { csPerMin: 8.5, gold: 440, kp: 0.6, deaths: 4.8 },
  },
  UTILITY: {
    metrics: ["vision", "kp", "deaths"],
    bench: { vision: 2, kp: 0.68, deaths: 5.5 },
  },
}
const DEFAULT_ROLE = ROLES.MIDDLE as RoleConfig

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
  }
}

function displayValue(metric: CoachMetric, raw: number): number {
  if (metric === "kp") return round(raw * 100)
  if (metric === "gold") return round(raw)
  if (metric === "deaths" || metric === "csPerMin" || metric === "vision") return round(raw, 1)
  return round(raw)
}

function displayTarget(metric: CoachMetric, target: number): number {
  return metric === "kp" ? round(target * 100) : round(target, metric === "gold" ? 0 : 1)
}

/** Grade only the metrics relevant to the player's role, against role benchmarks. */
export function analyzeCoaching(s: CoachInput): CoachTip[] {
  const cfg = ROLES[s.role] ?? DEFAULT_ROLE
  const tips: CoachTip[] = []
  for (const metric of cfg.metrics) {
    const target = cfg.bench[metric]
    if (target === undefined) continue
    const raw = rawValue(metric, s)
    const severity = metric === "deaths" ? gradeLower(raw, target) : gradeHigher(raw, target)
    tips.push({
      metric,
      severity,
      value: displayValue(metric, raw),
      target: displayTarget(metric, target),
    })
  }
  return tips
}
