export const PINGS_CDN = "https://raw.communitydragon.org/latest/game/assets/ux/minimap/pings"

export interface PingField {
  key: string
  label: string
  icon: string
}

export const PING_FIELDS: PingField[] = [
  { key: "onMyWayPings", label: "En route", icon: "on_my_way_new.png" },
  { key: "assistMePings", label: "Aidez-moi", icon: "assist.png" },
  { key: "enemyMissingPings", label: "Ennemi absent", icon: "mia_new.png" },
  { key: "dangerPings", label: "Danger", icon: "caution.png" },
  { key: "getBackPings", label: "Repli", icon: "get_back_small.png" },
  { key: "pushPings", label: "Pousser", icon: "push.png" },
  { key: "needVisionPings", label: "Vision", icon: "need_ward.png" },
  { key: "enemyVisionPings", label: "Vision ennemie", icon: "area_is_warded_small_red_new.png" },
  { key: "holdPings", label: "Tenir", icon: "hold.png" },
  { key: "allInPings", label: "All-in", icon: "all_in.png" },
  { key: "commandPings", label: "Commande", icon: "ping.png" },
  { key: "visionClearedPings", label: "Vision nettoyée", icon: "cleared.png" },
  { key: "basicPings", label: "Basique", icon: "ping.png" },
]

export const PING_BY_KEY: Record<string, PingField> = Object.fromEntries(
  PING_FIELDS.map((f) => [f.key, f])
)

export function pingIconUrl(icon: string): string {
  return `${PINGS_CDN}/${icon}`
}
