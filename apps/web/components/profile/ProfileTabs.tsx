"use client"

import { Radio } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"

type TabId = "overview" | "champions" | "live"

const TABS: { id: TabId; label: TranslationKey; icon?: boolean }[] = [
  { id: "overview", label: "tab.overview" },
  { id: "champions", label: "tab.champions" },
  { id: "live", label: "tab.live", icon: true },
]

interface ProfileTabsProps {
  overview: ReactNode
  champions: ReactNode
  live: ReactNode
}

export function ProfileTabs({ overview, champions, live }: ProfileTabsProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<TabId>("overview")

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

      {/* Each branch only mounts when active → 'live' stays lazy. */}
      {tab === "overview" && overview}
      {tab === "champions" && champions}
      {tab === "live" && live}
    </div>
  )
}
