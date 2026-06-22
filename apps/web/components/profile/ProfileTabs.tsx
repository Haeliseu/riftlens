"use client"

import { Radio } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { type ReactNode, useState } from "react"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"

type TabId = "overview" | "champions" | "coaching" | "mastery" | "challenges" | "live"

const TABS: { id: TabId; label: TranslationKey; icon?: boolean }[] = [
  { id: "overview", label: "tab.overview" },
  { id: "champions", label: "tab.champions" },
  { id: "coaching", label: "coach.title" },
  { id: "mastery", label: "mastery.title" },
  { id: "challenges", label: "challenges.title" },
  { id: "live", label: "tab.live", icon: true },
]

const TAB_IDS = new Set<string>(TABS.map((tab) => tab.id))

interface ProfileTabsProps {
  overview: ReactNode
  champions: ReactNode
  coaching: ReactNode
  mastery: ReactNode
  challenges: ReactNode
  live: ReactNode
}

export function ProfileTabs({
  overview,
  champions,
  coaching,
  mastery,
  challenges,
  live,
}: ProfileTabsProps) {
  const { t } = useI18n()
  // Allow deep-linking a tab via ?tab= (e.g. the leaderboard's LIVE badge).
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
            className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === item.id
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.icon && <Radio className="h-3.5 w-3.5" />}
            {t(item.label)}
          </button>
        ))}
      </div>

      {/* Each branch only mounts when active → heavy tabs stay lazy. */}
      {tab === "overview" && overview}
      {tab === "champions" && champions}
      {tab === "coaching" && coaching}
      {tab === "mastery" && mastery}
      {tab === "challenges" && challenges}
      {tab === "live" && live}
    </div>
  )
}
