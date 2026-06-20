"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { useMatchHistory } from "@/hooks/useMatchHistory"

interface ChampionStatsProps {
  region: string
  puuid?: string | null
}

interface ChampAgg {
  championId: number
  championName: string
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
}

export function ChampionStats({ region, puuid }: ChampionStatsProps) {
  const { data: matches, isLoading } = useMatchHistory(puuid, region)

  const byChamp = new Map<number, ChampAgg>()
  for (const m of matches ?? []) {
    const agg = byChamp.get(m.championId) ?? {
      championId: m.championId,
      championName: m.championName,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    }
    agg.games += 1
    agg.wins += m.win ? 1 : 0
    agg.kills += m.kills
    agg.deaths += m.deaths
    agg.assists += m.assists
    byChamp.set(m.championId, agg)
  }
  const champs = [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 5)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Champions (récents)</h3>
      {!puuid || (!isLoading && champs.length === 0) ? (
        <p className="text-xs text-muted-foreground py-2">Aucune donnée disponible</p>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-2 w-16 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {champs.map((c) => {
            const wr = Math.round((c.wins / c.games) * 100)
            const ratio = c.deaths === 0 ? c.kills + c.assists : (c.kills + c.assists) / c.deaths
            return (
              <div key={c.championId} className="flex items-center gap-2">
                {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
                <img
                  src={getChampionIconUrl(c.championId)}
                  alt={c.championName}
                  className="h-8 w-8 rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.championName}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.games} parties · {ratio.toFixed(2)} KDA
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}
                >
                  {wr}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
