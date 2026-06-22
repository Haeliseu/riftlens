"use client"

import { getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { REGIONS } from "@/components/home/SearchHero"
import { useI18n } from "@/lib/i18n"

const TIERS = [
  { id: "challenger", label: "Challenger", icon: "Challenger" as TierName },
  { id: "grandmaster", label: "Grandmaster", icon: "Grandmaster" as TierName },
  { id: "master", label: "Master", icon: "Master" as TierName },
]
const QUEUES = [
  { id: "RANKED_SOLO_5x5", label: "Solo/Duo" },
  { id: "RANKED_FLEX_SR", label: "Flex" },
]

interface LeaderRow {
  rank: number
  gameName: string | null
  tagLine: string | null
  leaguePoints: number
  wins: number
  losses: number
  winRate: number
}

interface LeaderboardData {
  tier: string
  region: string
  rows: LeaderRow[]
}

function useLeaderboard(region: string, tier: string, queue: string) {
  return useQuery({
    queryKey: ["leaderboard", region, tier, queue],
    queryFn: async () => {
      const res = await fetch(`/api/riot/leaderboard?region=${region}&tier=${tier}&queue=${queue}`)
      if (!res.ok) throw new Error("Leaderboard unavailable")
      return (await res.json()) as LeaderboardData
    },
    staleTime: 3_600_000,
  })
}

export function LeaderboardTable() {
  const { t } = useI18n()
  const [region, setRegion] = useState("EUW1")
  const [tier, setTier] = useState("challenger")
  const [queue, setQueue] = useState("RANKED_SOLO_5x5")
  const { data, isLoading, isError } = useLeaderboard(region, tier, queue)
  const tierIcon = TIERS.find((t) => t.id === tier)?.icon ?? ("Challenger" as TierName)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-9 rounded-md border bg-card px-3 text-sm"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="flex rounded-md bg-muted p-0.5">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              className={`rounded px-2.5 py-1 text-xs ${
                tier === t.id ? "bg-background font-medium" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-md bg-muted p-0.5">
          {QUEUES.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setQueue(q.id)}
              className={`rounded px-2.5 py-1 text-xs ${
                queue === q.id ? "bg-background font-medium" : "text-muted-foreground"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("leaderboard.loading")}</p>
      ) : isError || !data ? (
        <p className="text-sm text-muted-foreground">{t("leaderboard.unavailable")}</p>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b text-[11px] text-muted-foreground uppercase">
            <span className="w-8">#</span>
            <span className="flex-1">{t("leaderboard.col.player")}</span>
            <span className="w-16 text-right">LP</span>
            <span className="w-28 text-right">{t("leaderboard.col.wins")}</span>
            <span className="w-12 text-right">{t("leaderboard.col.wr")}</span>
          </div>
          {data.rows.map((r) => {
            const href =
              r.gameName && r.tagLine
                ? `/profile/${region}/${encodeURIComponent(r.gameName)}/${encodeURIComponent(r.tagLine)}`
                : null
            return (
              <div
                key={r.rank}
                className="flex items-center gap-3 px-4 py-2 border-b last:border-0"
              >
                <span className="w-8 font-mono text-sm text-muted-foreground">{r.rank}</span>
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                  <img src={getRankIconUrl(tierIcon)} alt="" className="h-6 w-6" />
                  {href ? (
                    <Link href={href} className="text-sm font-medium truncate hover:underline">
                      {r.gameName}
                      <span className="text-muted-foreground font-normal"> #{r.tagLine}</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("leaderboard.hidden")}</span>
                  )}
                </div>
                <span className="w-16 text-right text-sm font-mono">{r.leaguePoints}</span>
                <span className="w-28 text-right text-xs text-muted-foreground">
                  {r.wins}
                  {t("perf.winShort")} {r.losses}
                  {t("perf.lossShort")}
                </span>
                <span
                  className={`w-12 text-right text-sm font-semibold ${r.winRate >= 50 ? "text-blue-500" : "text-red-500"}`}
                >
                  {r.winRate}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
