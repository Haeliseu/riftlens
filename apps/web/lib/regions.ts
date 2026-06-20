/** Display label + badge color for a Riot platform region id (e.g. NA1 -> "NA"). */
export const REGION_BADGE: Record<string, { label: string; color: string }> = {
  EUW1: { label: "EUW", color: "#3B82F6" },
  EUN1: { label: "EUNE", color: "#22C55E" },
  NA1: { label: "NA", color: "#EF4444" },
  KR: { label: "KR", color: "#8B5CF6" },
  BR1: { label: "BR", color: "#EAB308" },
  JP1: { label: "JP", color: "#EC4899" },
  OC1: { label: "OCE", color: "#06B6D4" },
  TR1: { label: "TR", color: "#F97316" },
  LA1: { label: "LAN", color: "#14B8A6" },
  LA2: { label: "LAS", color: "#A855F7" },
  RU: { label: "RU", color: "#64748B" },
}

export function regionBadge(region: string): { label: string; color: string } {
  return REGION_BADGE[region] ?? { label: region, color: "#64748B" }
}
