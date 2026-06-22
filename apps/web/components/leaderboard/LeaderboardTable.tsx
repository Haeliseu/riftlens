"use client"

import { getChampionIconUrl, getProfileIconUrl, type TierName } from "@riftlens/riot-api"
import { useInfiniteQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { REGIONS } from "@/components/home/SearchHero"
import { useLiveStatus } from "@/hooks/useLiveStatus"
import { useI18n } from "@/lib/i18n"
import { ROLES, roleIconUrl } from "@/lib/roles"

const TIERS = [
  { id: "challenger", label: "Challenger", icon: "Challenger" as TierName },
  { id: "grandmaster", label: "Grandmaster", icon: "Grandmaster" as TierName },
  { id: "master", label: "Master", icon: "Master" as TierName },
]
const QUEUES = [
  { id: "RANKED_SOLO_5x5", label: "Solo/Duo" },
  { id: "RANKED_FLEX_SR", label: "Flex" },
]

interface SeasonChamp {
  championId: number
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
}

interface LeaderRow {
  rank: number
  puuid: string
  gameName: string | null
  tagLine: string | null
  profileIconId: number | null
  leaguePoints: number
  wins: number
  losses: number
  winRate: number
  mainRole: string | null
  topChampions: SeasonChamp[]
}

interface LeaderboardData {
  tier: string
  region: string
  rows: LeaderRow[]
  total: number
  offset: number
}

function useLeaderboard(region: string, tier: string, queue: string) {
  return useInfiniteQuery({
    queryKey: ["leaderboard", region, tier, queue],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/riot/leaderboard?region=${region}&tier=${tier}&queue=${queue}&offset=${pageParam}`
      )
      if (!res.ok) throw new Error("Leaderboard unavailable")
      return (await res.json()) as LeaderboardData
    },
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.offset + last.rows.length
      return next < last.total ? next : undefined
    },
    // Short so champions backfilled in the background show up on the next visit.
    staleTime: 60_000,
  })
}

export function LeaderboardTable() {
  const { t } = useI18n()
  const [region, setRegion] = useState("EUW1")
  const [tier, setTier] = useState("challenger")
  const [queue, setQueue] = useState("RANKED_SOLO_5x5")
  const [role, setRole] = useState<string>("ALL")
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLeaderboard(region, tier, queue)
  const allRows = data?.pages.flatMap((p) => p.rows) ?? []
  // Role filter is best-effort: it only matches players whose season data is in
  // our DB (others fill in over time as the ladder is backfilled).
  const rows = role === "ALL" ? allRows : allRows.filter((r) => r.mainRole === role)
  const { data: liveStatus } = useLiveStatus(
    region,
    rows.map((r) => r.puuid)
  )

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
        {/* Role filter (by each player's main role) */}
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              title={t(r.label)}
              onClick={() => setRole(role === r.id ? "ALL" : r.id)}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                role === r.id ? "ring-2 ring-primary bg-accent" : "opacity-50 hover:opacity-100"
              }`}
            >
              {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
              <img src={roleIconUrl(r.id)} alt={t(r.label)} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("leaderboard.loading")}</p>
      ) : isError || rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("leaderboard.unavailable")}</p>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b text-[11px] text-muted-foreground uppercase">
            <span className="w-8">#</span>
            <span className="flex-1">{t("leaderboard.col.player")}</span>
            <span className="w-[120px] text-right hidden sm:block">{t("champPerf.title")}</span>
            <span className="w-16 text-right">LP</span>
            <span className="w-24 text-right">{t("leaderboard.col.wins")}</span>
            <span className="w-12 text-right">{t("leaderboard.col.wr")}</span>
          </div>
          {rows.map((r) => {
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
                  <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    {r.profileIconId != null && (
                      // biome-ignore lint/performance/noImgElement: external CDN icon
                      <img
                        src={getProfileIconUrl(r.profileIconId)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {r.mainRole && (
                    // biome-ignore lint/performance/noImgElement: external CDN icon
                    <img src={roleIconUrl(r.mainRole)} alt="" className="h-4 w-4 flex-shrink-0" />
                  )}
                  {href ? (
                    <Link href={href} className="text-sm font-medium truncate hover:underline">
                      {r.gameName}
                      <span className="text-muted-foreground font-normal"> #{r.tagLine}</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("leaderboard.hidden")}</span>
                  )}
                  {liveStatus?.[r.puuid] && (
                    <span
                      title={t("leaderboard.inGame")}
                      className="flex flex-shrink-0 items-center gap-1 rounded bg-[var(--color-win)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-win)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-win)] animate-pulse" />
                      {t("leaderboard.live")}
                    </span>
                  )}
                </div>
                <div className="w-[120px] hidden sm:flex justify-end gap-1">
                  {r.topChampions.map((c) => (
                    // biome-ignore lint/performance/noImgElement: external CDN icon
                    <img
                      key={c.championId}
                      src={getChampionIconUrl(c.championId)}
                      alt=""
                      className="h-7 w-7 rounded"
                    />
                  ))}
                </div>
                <span className="w-16 text-right text-sm font-mono">{r.leaguePoints}</span>
                <span className="w-24 text-right text-xs text-muted-foreground">
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
          {hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              {isFetchingNextPage ? t("common.loading") : t("leaderboard.loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
