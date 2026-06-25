/**
 * Google AdSense config. Everything is gated on env vars so ads are entirely
 * OFF until configured — when off, the script never loads and the ad slots
 * render nothing (no empty frames), per Google's policy on blank ad space.
 *
 * - NEXT_PUBLIC_ADSENSE_CLIENT: the publisher id, e.g. "ca-pub-1234567890".
 * - NEXT_PUBLIC_ADSENSE_SLOT_*: per-placement ad-unit ids from the account.
 *
 * A placement renders only when BOTH the client and that slot id are set.
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || ""

/** True only when a real publisher id is configured. */
export const adsEnabled = ADSENSE_CLIENT.startsWith("ca-pub-")

/** Per-placement ad-unit slot ids. Empty string = that placement stays off. */
export const AD_SLOTS = {
  dashboardTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_TOP?.trim() || "",
  profileSidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PROFILE_SIDEBAR?.trim() || "",
} as const

export type AdSlotId = keyof typeof AD_SLOTS
