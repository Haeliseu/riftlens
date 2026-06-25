"use client"

import { Radio } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { type ReactNode, useState } from "react"
import { Link } from "@/components/Link"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"

type TabId = "overview" | "champions" | "coaching" | "mastery" | "challenges"

const TABS: { id: TabId; label: TranslationKey }[] = [
  { id: "overview", label: "tab.overview" },
  { id: "champions", label: "tab.champions" },
  { id: "coaching", label: "coach.title" },
  { id: "mastery", label: "mastery.title" },
  { id: "challenges", label: "challenges.title" },
]

const TAB_IDS = new Set<string>(TABS.map((tab) => tab.id))

interface ProfileTabsProps {
  overview: ReactNode
  champions: ReactNode
  coaching: ReactNode
  mastery: ReactNode
  challenges: ReactNode
  /** Live is its own server-prefetched page, linked from the tab bar. */
  liveHref: string
}

const TAB_CLASS = "flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors"

export function ProfileTabs({
  overview,
  champions,
  coaching,
  mastery,
  challenges,
  liveHref,
}: ProfileTabsProps) {
  const { t } = useI18n()
  // Allow deep-linking a tab via ?tab= (e.g. the leaderboard).
  const initial = useSearchParams().get("tab")
  const [tab, setTab] = useState<TabId>(
    initial && TAB_IDS.has(initial) ? (initial as TabId) : "overview"
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`${TAB_CLASS} ${
              tab === item.id
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(item.label)}
          </button>
        ))}
        {/* Live opens its dedicated, server-prefetched page rather than a tab. */}
        <Link
          href={liveHref}
          className={`${TAB_CLASS} border-transparent text-muted-foreground hover:text-foreground`}
        >
          <Radio className="h-3.5 w-3.5" />
          {t("tab.live")}
        </Link>
      </div>

      {/* Each branch only mounts when active → heavy tabs stay lazy. */}
      {tab === "overview" && overview}
      {tab === "champions" && champions}
      {tab === "coaching" && coaching}
      {tab === "mastery" && mastery}
      {tab === "challenges" && challenges}
    </div>
  )
}
