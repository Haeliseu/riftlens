"use client"

import type { ChampionAggregate, ChampionBucket } from "@riftlens/riot-api"
import { getChampionIconUrl } from "@riftlens/riot-api"
import { useState } from "react"
import { useChampionStats } from "@/hooks/useChampionStats"

interface ChampionStatsProps {
  region: string
  puuid?: string | null
}

type Mode = "total" | "solo" | "flex"

const TABS: { id: Mode; label: string }[] = [
  { id: "total", label: "Total" },
  { id: "solo", label: "Solo/Duo" },
  { id: "flex", label: "Flex" },
]

function bucketOf(c: ChampionAggregate, mode: Mode): ChampionBucket {
  return c[mode]
}

export function ChampionStats({ region, puuid }: ChampionStatsProps) {
  const [mode, setMode] = useState<Mode>("total")
  const { data, isLoading } = useChampionStats(puuid, region)

  const champs = (data ?? [])
    .filter((c) => bucketOf(c, mode).games > 0)
    .sort((a, b) => bucketOf(b, mode).games - bucketOf(a, mode).games)
    .slice(0, 7)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Champions</h3>
        <div className="flex rounded-md bg-muted p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={`px-2 py-0.5 text-xs rounded ${
                mode === t.id ? "bg-background font-medium" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!puuid || (!isLoading && champs.length === 0) ? (
        <p className="text-xs text-muted-foreground py-2">Aucune partie classée pour ce filtre.</p>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
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
            const b = bucketOf(c, mode)
            const wr = Math.round((b.wins / b.games) * 100)
            const ratio = b.deaths === 0 ? b.kills + b.assists : (b.kills + b.assists) / b.deaths
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
                    {b.games} parties · {ratio.toFixed(2)} KDA
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}
                  >
                    {wr}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.wins}V {b.games - b.wins}D
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
