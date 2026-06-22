import type { TranslationKey } from "@/lib/i18n/dictionaries"

/** Tier color from an UPPERCASE Riot tier (e.g. "DIAMOND") or capitalized TierName. */
export const TIER_COLOR: Record<string, string> = {
  IRON: "#888",
  BRONZE: "#c07840",
  SILVER: "#94a3b8",
  GOLD: "#EF9F27",
  PLATINUM: "#1D9E75",
  EMERALD: "#639922",
  DIAMOND: "#378ADD",
  MASTER: "#8a6ddd",
  GRANDMASTER: "#D85A30",
  CHALLENGER: "#f0c840",
}

export function tierColor(tier: string): string {
  return TIER_COLOR[tier.toUpperCase()] ?? "#888"
}

const TIER_KEY: Record<string, TranslationKey> = {
  IRON: "tier.iron",
  BRONZE: "tier.bronze",
  SILVER: "tier.silver",
  GOLD: "tier.gold",
  PLATINUM: "tier.platinum",
  EMERALD: "tier.emerald",
  DIAMOND: "tier.diamond",
  MASTER: "tier.master",
  GRANDMASTER: "tier.grandmaster",
  CHALLENGER: "tier.challenger",
}

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string

/** Localized "Diamond III" / "Master" (apex tiers have no division). */
export function rankLabel(t: Translate, tier: string, division: string): string {
  const key = TIER_KEY[tier.toUpperCase()]
  const name = key ? t(key) : tier
  return APEX_TIERS.has(tier.toUpperCase()) ? name : `${name} ${division}`
}

/** Localized bare tier name. */
export function tierLabel(t: Translate, tier: string): string {
  const key = TIER_KEY[tier.toUpperCase()]
  return key ? t(key) : tier
}

export const RANK_FR: Record<string, string> = {
  IRON: "Fer",
  BRONZE: "Bronze",
  SILVER: "Argent",
  GOLD: "Or",
  PLATINUM: "Platine",
  EMERALD: "Émeraude",
  DIAMOND: "Diamant",
  MASTER: "Maître",
  GRANDMASTER: "Grand Maître",
  CHALLENGER: "Challenger",
}

export const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"])

/** "Diamant III" / "Maître" (apex tiers have no division). */
export function rankLabelFr(tier: string, division: string): string {
  const fr = RANK_FR[tier.toUpperCase()] ?? tier
  return APEX_TIERS.has(tier.toUpperCase()) ? fr : `${fr} ${division}`
}

/** league-v4 returns UPPERCASE tier; riot-api utils expect "Diamond" capitalization. */
export function capitalizeTier(tier: string): string {
  return (tier[0] ?? "") + tier.slice(1).toLowerCase()
}
