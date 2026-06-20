"use client"

import { Radio } from "lucide-react"
import { type ReactNode, useState } from "react"

type TabId = "overview" | "champions" | "stats" | "live"

const TABS: { id: TabId; label: string; icon?: boolean }[] = [
  { id: "overview", label: "Aperçu" },
  { id: "champions", label: "Champions" },
  { id: "stats", label: "Statistiques détaillées" },
  { id: "live", label: "En direct", icon: true },
]

interface ProfileTabsProps {
  overview: ReactNode
  champions: ReactNode
  stats: ReactNode
  live: ReactNode
}

export function ProfileTabs({ overview, champions, stats, live }: ProfileTabsProps) {
  const [tab, setTab] = useState<TabId>("overview")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon && <Radio className="h-3.5 w-3.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Each branch only mounts when active → 'En direct' stays lazy. */}
      {tab === "overview" && overview}
      {tab === "champions" && champions}
      {tab === "stats" && stats}
      {tab === "live" && live}
    </div>
  )
}
