import type { TranslationKey } from "@/lib/i18n/dictionaries"

export const PINGS_CDN = "https://raw.communitydragon.org/latest/game/assets/ux/minimap/pings"

export interface PingField {
  key: string
  labelKey: TranslationKey
  icon: string
}

export const PING_FIELDS: PingField[] = [
  { key: "onMyWayPings", labelKey: "ping.onMyWay", icon: "on_my_way_new.png" },
  { key: "assistMePings", labelKey: "ping.assistMe", icon: "assist.png" },
  { key: "enemyMissingPings", labelKey: "ping.enemyMissing", icon: "mia_new.png" },
  { key: "dangerPings", labelKey: "ping.danger", icon: "caution.png" },
  { key: "getBackPings", labelKey: "ping.getBack", icon: "get_back_small.png" },
  { key: "pushPings", labelKey: "ping.push", icon: "push.png" },
  { key: "needVisionPings", labelKey: "ping.needVision", icon: "need_ward.png" },
  {
    key: "enemyVisionPings",
    labelKey: "ping.enemyVision",
    icon: "area_is_warded_small_red_new.png",
  },
  { key: "holdPings", labelKey: "ping.hold", icon: "hold.png" },
  { key: "allInPings", labelKey: "ping.allIn", icon: "all_in.png" },
  { key: "commandPings", labelKey: "ping.command", icon: "ping.png" },
  { key: "visionClearedPings", labelKey: "ping.visionCleared", icon: "cleared.png" },
  { key: "basicPings", labelKey: "ping.basic", icon: "ping.png" },
]

export const PING_BY_KEY: Record<string, PingField> = Object.fromEntries(
  PING_FIELDS.map((f) => [f.key, f])
)

export function pingIconUrl(icon: string): string {
  return `${PINGS_CDN}/${icon}`
}
