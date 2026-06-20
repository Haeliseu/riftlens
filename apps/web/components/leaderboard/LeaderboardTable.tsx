"use client"

import { getRankIconUrl } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { REGIONS } from "@/components/home/SearchHero"

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

function useLeaderboard(region: string) {
  return useQuery({
    queryKey: ["leaderboard", region],
    queryFn: async () => {
      const res = await fetch(`/api/riot/leaderboard?region=${region}`)
      if (!res.ok) throw new Error("Leaderboard unavailable")
      return (await res.json()) as LeaderboardData
    },
    staleTime: 3_600_000,
  })
}

export function LeaderboardTable() {
  const [region, setRegion] = useState("EUW1")
  const { data, isLoading, isError } = useLeaderboard(region)

  return (
    <div className="space-y-4">
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement du classement…</p>
      ) : isError || !data ? (
        <p className="text-sm text-muted-foreground">Classement indisponible (clé API Riot ?).</p>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b text-[11px] text-muted-foreground uppercase">
            <span className="w-8">#</span>
            <span className="flex-1">Joueur</span>
            <span className="w-16 text-right">LP</span>
            <span className="w-28 text-right">Victoires</span>
            <span className="w-12 text-right">WR</span>
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
                  <img src={getRankIconUrl("Challenger")} alt="" className="h-6 w-6" />
                  {href ? (
                    <Link href={href} className="text-sm font-medium truncate hover:underline">
                      {r.gameName}
                      <span className="text-muted-foreground font-normal"> #{r.tagLine}</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Joueur masqué</span>
                  )}
                </div>
                <span className="w-16 text-right text-sm font-mono">{r.leaguePoints}</span>
                <span className="w-28 text-right text-xs text-muted-foreground">
                  {r.wins}V {r.losses}D
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
