"use client"

import { useSearchParams } from "next/navigation"
import { type ReactNode, useState } from "react"
import { type ProfileTab, ProfileTabBar } from "@/components/profile/ProfileTabBar"

type ContentTab = Exclude<ProfileTab, "live">

const CONTENT_IDS = new Set<string>(["overview", "champions", "coaching", "mastery", "challenges"])

interface ProfileTabsProps {
  overview: ReactNode
  champions: ReactNode
  coaching: ReactNode
  mastery: ReactNode
  challenges: ReactNode
  /** Unprefixed profile path, e.g. /profile/EUW1/Name/Tag. */
  basePath: string
}

export function ProfileTabs({
  overview,
  champions,
  coaching,
  mastery,
  challenges,
  basePath,
}: ProfileTabsProps) {
  // Allow deep-linking a tab via ?tab= (e.g. from the /live page).
  const initial = useSearchParams().get("tab")
  const [tab, setTab] = useState<ContentTab>(
    initial && CONTENT_IDS.has(initial) ? (initial as ContentTab) : "overview"
  )

  return (
    <div className="space-y-4">
      <ProfileTabBar active={tab} basePath={basePath} onSelect={setTab} />

      {/* Each branch only mounts when active → heavy tabs stay lazy. */}
      {tab === "overview" && overview}
      {tab === "champions" && champions}
      {tab === "coaching" && coaching}
      {tab === "mastery" && mastery}
      {tab === "challenges" && challenges}
    </div>
  )
}
