const SVG =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg"

const ROLE_ICON: Record<string, string> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "middle",
  BOTTOM: "bottom",
  UTILITY: "utility",
}

/** White position icon (visible on dark bg). */
export function roleIconUrl(role: string): string {
  return `${SVG}/position-${ROLE_ICON[role] ?? "middle"}-light.svg`
}

export const ROLES = [
  { id: "TOP", label: "Top" },
  { id: "JUNGLE", label: "Jungle" },
  { id: "MIDDLE", label: "Mid" },
  { id: "BOTTOM", label: "ADC" },
  { id: "UTILITY", label: "Support" },
]
