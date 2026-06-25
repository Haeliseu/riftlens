import type { TranslationKey } from "@/lib/i18n/dictionaries"

/** Display label + badge color for a Riot platform region id (e.g. NA1 -> "NA"). */
export const REGION_BADGE: Record<string, { label: string; color: string }> = {
  NA1: { label: "NA", color: "#EF4444" },
  EUW1: { label: "EUW", color: "#3B82F6" },
  EUN1: { label: "EUNE", color: "#22C55E" },
  KR: { label: "KR", color: "#8B5CF6" },
  BR1: { label: "BR", color: "#EAB308" },
  JP1: { label: "JP", color: "#EC4899" },
  RU: { label: "RU", color: "#64748B" },
  OC1: { label: "OCE", color: "#06B6D4" },
  TR1: { label: "TR", color: "#F97316" },
  LA1: { label: "LAN", color: "#14B8A6" },
  LA2: { label: "LAS", color: "#A855F7" },
  SG2: { label: "SEA", color: "#0EA5E9" },
  TW2: { label: "TW", color: "#10B981" },
  VN2: { label: "VN", color: "#F43F5E" },
}

/** Ordered list of selectable regions (platform ids supported by the API client). */
export const REGION_IDS = Object.keys(REGION_BADGE)

/** i18n key for each region's full name. */
export const REGION_NAME_KEY: Record<string, TranslationKey> = {
  NA1: "region.NA1",
  EUW1: "region.EUW1",
  EUN1: "region.EUN1",
  KR: "region.KR",
  BR1: "region.BR1",
  JP1: "region.JP1",
  RU: "region.RU",
  OC1: "region.OC1",
  TR1: "region.TR1",
  LA1: "region.LA1",
  LA2: "region.LA2",
  SG2: "region.SG2",
  TW2: "region.TW2",
  VN2: "region.VN2",
}

export function regionBadge(region: string): { label: string; color: string } {
  return REGION_BADGE[region] ?? { label: region, color: "#64748B" }
}

/** Friendly URL slug for each region id (e.g. NA1 -> "na", EUW1 -> "euw"). */
export const REGION_SLUG: Record<string, string> = {
  NA1: "na",
  EUW1: "euw",
  EUN1: "eune",
  KR: "kr",
  BR1: "br",
  JP1: "jp",
  RU: "ru",
  OC1: "oce",
  TR1: "tr",
  LA1: "lan",
  LA2: "las",
  SG2: "sea",
  TW2: "tw",
  VN2: "vn",
}

export function regionToSlug(regionId: string): string {
  return REGION_SLUG[regionId] ?? regionId.toLowerCase()
}

// Accept the slug ("na"), the raw id ("na1"), or the badge label ("eune").
const SLUG_TO_ID = new Map<string, string>()
for (const [id, slug] of Object.entries(REGION_SLUG)) {
  SLUG_TO_ID.set(slug, id)
  SLUG_TO_ID.set(id.toLowerCase(), id)
}

/** Resolve a URL slug back to a Riot region id, or null if unknown. */
export function regionFromSlug(slug: string): string | null {
  return SLUG_TO_ID.get(slug.toLowerCase()) ?? null
}
