"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { useChampionStats } from "@/hooks/useChampionStats"
import { useI18n } from "@/lib/i18n"
import type { ChampDetailBucket } from "@/lib/profile-db"

interface Props {
  puuid?: string | null
  region: string
}

function avg(sum: number, games: number): number {
  return games > 0 ? sum / games : 0
}

function kda(b: ChampDetailBucket): string {
  const r = b.deaths === 0 ? b.kills + b.assists : (b.kills + b.assists) / b.deaths
  return r.toFixed(2)
}

export function ChampionPerformance({ puuid, region }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useChampionStats(puuid, region)
  const champs = (data ?? [])
    .filter((c) => c.total.games > 0)
    .sort((a, b) => b.total.games - a.total.games)
    .slice(0, 6)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-3">{t("champPerf.title")}</h3>
      {!puuid || (!isLoading && champs.length === 0) ? (
        <p className="text-sm text-muted-foreground py-1">{t("champStats.empty")}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground uppercase">
            <span className="flex-1">{t("champStats.col.champion")}</span>
            <span className="w-14 text-right">{t("champStats.col.kda")}</span>
            <span className="w-14 text-right">{t("champStats.col.csPerMin")}</span>
            <span className="w-12 text-right">{t("roles.col.games")}</span>
            <span className="w-12 text-right">{t("champStats.col.wr")}</span>
          </div>
          {champs.map((c) => {
            const b = c.total
            const wr = Math.round((b.wins / b.games) * 100)
            return (
              <div key={c.championId} className="flex items-center text-sm">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                  <img
                    src={getChampionIconUrl(c.championId)}
                    alt={c.championName}
                    className="h-7 w-7 rounded flex-shrink-0"
                  />
                  <span className="truncate">{c.championName}</span>
                </div>
                <span className="w-14 text-right font-medium">{kda(b)}</span>
                <span className="w-14 text-right text-muted-foreground">
                  {avg(b.csPerMin, b.games).toFixed(1)}
                </span>
                <span className="w-12 text-right text-muted-foreground">{b.games}</span>
                <span
                  className={`w-12 text-right font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}
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
