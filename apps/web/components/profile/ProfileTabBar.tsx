"use client"

import { Radio } from "lucide-react"
import { Link } from "@/components/Link"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"

export type ProfileTab = "overview" | "champions" | "coaching" | "mastery" | "challenges" | "live"

export const PROFILE_TABS: { id: ProfileTab; label: TranslationKey; icon?: boolean }[] = [
  { id: "overview", label: "tab.overview" },
  { id: "champions", label: "tab.champions" },
  { id: "coaching", label: "coach.title" },
  { id: "mastery", label: "mastery.title" },
  { id: "challenges", label: "challenges.title" },
  { id: "live", label: "tab.live", icon: true },
]

const TAB_CLASS = "flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors"
const cls = (active: boolean) =>
  `${TAB_CLASS} ${
    active
      ? "border-primary text-foreground font-medium"
      : "border-transparent text-muted-foreground hover:text-foreground"
  }`

interface ProfileTabBarProps {
  active: ProfileTab
  /** Unprefixed profile path, e.g. /profile/EUW1/Name/Tag (locale added by Link). */
  basePath: string
  /**
   * When set, the in-page tabs (everything but Live) are buttons that switch
   * client-side — used on the profile page so switching is instant and never
   * re-fetches. When omitted (the /live page), they are links back to the
   * profile so the bar still navigates cleanly.
   */
  onSelect?: (id: Exclude<ProfileTab, "live">) => void
}

export function ProfileTabBar({ active, basePath, onSelect }: ProfileTabBarProps) {
  const { t } = useI18n()

  return (
    <div className="flex gap-1 border-b">
      {PROFILE_TABS.map((item) => {
        const isActive = active === item.id
        // Live is handled first; everything below is a content tab.
        const contentId = item.id as Exclude<ProfileTab, "live">
        const content = (
          <>
            {item.icon && <Radio className="h-3.5 w-3.5" />}
            {t(item.label)}
          </>
        )

        // Live always opens its dedicated, server-prefetched page.
        if (item.id === "live") {
          return (
            <Link key={item.id} href={`${basePath}/live`} className={cls(isActive)}>
              {content}
            </Link>
          )
        }

        // Profile page: instant client-side switch.
        if (onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(contentId)}
              className={cls(isActive)}
            >
              {content}
            </button>
          )
        }

        // /live page: link back to the profile (deep-linking the chosen tab).
        const href = item.id === "overview" ? basePath : `${basePath}?tab=${item.id}`
        return (
          <Link key={item.id} href={href} className={cls(isActive)}>
            {content}
          </Link>
        )
      })}
    </div>
  )
}
