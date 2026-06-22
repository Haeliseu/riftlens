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

import type { TranslationKey } from "@/lib/i18n/dictionaries"

export const ROLES: { id: string; label: TranslationKey }[] = [
  { id: "TOP", label: "role.top" },
  { id: "JUNGLE", label: "role.jungle" },
  { id: "MIDDLE", label: "role.mid" },
  { id: "BOTTOM", label: "role.adc" },
  { id: "UTILITY", label: "role.support" },
]

const ROLE_KEY: Record<string, TranslationKey> = {
  TOP: "role.top",
  JUNGLE: "role.jungle",
  MIDDLE: "role.mid",
  BOTTOM: "role.adc",
  UTILITY: "role.support",
  UNKNOWN: "role.other",
}

export function roleKey(role: string): TranslationKey {
  return ROLE_KEY[role] ?? "role.other"
}
