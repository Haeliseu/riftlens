export type TierName =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Emerald"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Challenger"

export type Division = "I" | "II" | "III" | "IV"

const TIER_BASE: Record<TierName, number> = {
  Iron: 0,
  Bronze: 400,
  Silver: 800,
  Gold: 1200,
  Platinum: 1600,
  Emerald: 2000,
  Diamond: 2400,
  Master: 2800,
  Grandmaster: 3200,
  Challenger: 3600,
}

const DIVISION_OFFSET: Record<Division, number> = { IV: 0, III: 100, II: 200, I: 300 }

export function tierToLP(tier: TierName, division: Division, lp: number): number {
  // v8 ignore next — DIVISION_OFFSET always has all Division keys
  return TIER_BASE[tier] + (DIVISION_OFFSET[division] ?? 0) + lp
}

export function lpToTier(value: number): { tier: TierName; division: Division; lp: number } {
  const tiers = Object.entries(TIER_BASE) as [TierName, number][]
  // v8 ignore next 10 — entry is always defined (Object.entries), division index always 0-3
  for (let i = tiers.length - 1; i >= 0; i--) {
    const entry = tiers[i]
    if (entry === undefined) continue
    const [tier, base] = entry
    if (value >= base) {
      const remainder = value - base
      const divisionIndex = Math.min(3, Math.floor(remainder / 100))
      const divisions: Division[] = ["IV", "III", "II", "I"]
      const division = divisions[divisionIndex] ?? "IV"
      return { tier, division, lp: remainder % 100 }
    }
  }
  return { tier: "Iron", division: "IV", lp: 0 }
}

export interface RankedEntry {
  tier: TierName
  division: Division
  leaguePoints: number
}

export function computeAverageGameRank(participantRanks: RankedEntry[]): {
  tier: TierName
  division: Division
} {
  if (participantRanks.length === 0) {
    return { tier: "Gold", division: "IV" }
  }
  const values = participantRanks
    .map((r) => tierToLP(r.tier, r.division, r.leaguePoints))
    .sort((a, b) => a - b)
  // v8 ignore next — values is non-empty (participantRanks.length > 0 checked above)
  const median = values[Math.floor(values.length / 2)] ?? 0
  const { tier, division } = lpToTier(median)
  return { tier, division }
}

const CDN =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images"

/** Tightly-cropped mini-crest (SVG) — fills its box far better than the padded emblem. */
export function getRankIconUrl(tier: TierName): string {
  return `${CDN}/ranked-mini-crests/${tier.toLowerCase()}.svg`
}

/** The large winged emblem (lots of transparent padding); use only at big sizes. */
export function getRankEmblemUrl(tier: TierName): string {
  return `${CDN}/ranked-emblem/emblem-${tier.toLowerCase()}.png`
}
