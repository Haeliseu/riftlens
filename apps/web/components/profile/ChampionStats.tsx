"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { useState } from "react"
import { useChampionStats } from "@/hooks/useChampionStats"
import { useLpPerGame } from "@/hooks/useLpPerGame"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import type { ChampDetailBucket, ChampionDetail } from "@/lib/profile-db"

type Mode = "total" | "solo" | "flex"

const TABS: { id: Mode; label: TranslationKey }[] = [
  { id: "total", label: "champStats.tab.total" },
  { id: "solo", label: "champStats.tab.solo" },
  { id: "flex", label: "champStats.tab.flex" },
]

interface ChampionStatsProps {
  region: string
  puuid?: string | null
}

function avg(sum: number, games: number): number {
  return games > 0 ? sum / games : 0
}

function kda(b: ChampDetailBucket): string {
  const r = b.deaths === 0 ? b.kills + b.assists : (b.kills + b.assists) / b.deaths
  return r.toFixed(2)
}

export function ChampionStats({ region, puuid }: ChampionStatsProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>("total")
  const { data, isLoading } = useChampionStats(puuid, region)
  const { data: lpPerGame } = useLpPerGame(puuid)

  const champs = (data ?? [])
    .filter((c) => c[mode].games > 0)
    .sort((a, b) => b[mode].games - a[mode].games)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{t("champStats.title")}</h3>
        <div className="flex rounded-md bg-muted p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`px-2.5 py-0.5 text-xs rounded ${
                mode === tab.id ? "bg-background font-medium" : "text-muted-foreground"
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {!puuid || (!isLoading && champs.length === 0) ? (
        <p className="text-xs text-muted-foreground py-2">{t("champStats.empty")}</p>
      ) : isLoading ? (
        <p className="text-xs text-muted-foreground py-2">{t("common.loading")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase text-muted-foreground border-b">
                <th className="text-left font-medium py-1.5 pr-2">
                  {t("champStats.col.champion")}
                </th>
                <th className="text-right font-medium px-2">{t("champStats.col.games")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.wr")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.lp")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.kda")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.kdaDetail")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.csPerMin")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.kp")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.gold")}</th>
                <th className="text-right font-medium px-2">{t("champStats.col.damage")}</th>
                <th className="text-right font-medium pl-2">{t("champStats.col.vision")}</th>
              </tr>
            </thead>
            <tbody>
              {champs.map((c: ChampionDetail) => {
                const b = c[mode]
                const wr = Math.round((b.wins / b.games) * 100)
                return (
                  <tr key={c.championId} className="border-b last:border-0">
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                        <img
                          src={getChampionIconUrl(c.championId)}
                          alt={c.championName}
                          className="h-6 w-6 rounded flex-shrink-0"
                        />
                        <span className="font-medium truncate">{c.championName}</span>
                      </div>
                    </td>
                    <td className="text-right px-2 text-muted-foreground">{b.games}</td>
                    <td
                      className={`text-right px-2 font-semibold ${wr >= 50 ? "text-blue-500" : "text-red-500"}`}
                    >
                      {wr}%
                    </td>
                    <td className="text-right px-2">
                      {(() => {
                        const lp = lpPerGame?.byChampion[c.championId]
                        if (lp == null || lp === 0)
                          return <span className="text-muted-foreground">—</span>
                        return (
                          <span className={lp > 0 ? "text-green-500" : "text-red-500"}>
                            {lp > 0 ? "+" : ""}
                            {lp}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="text-right px-2 font-medium">{kda(b)}</td>
                    <td className="text-right px-2 text-muted-foreground">
                      {avg(b.kills, b.games).toFixed(1)}/{avg(b.deaths, b.games).toFixed(1)}/
                      {avg(b.assists, b.games).toFixed(1)}
                    </td>
                    <td className="text-right px-2 text-muted-foreground">
                      {avg(b.csPerMin, b.games).toFixed(1)}
                    </td>
                    <td className="text-right px-2 text-muted-foreground">
                      {Math.round(avg(b.kp, b.games) * 100)}%
                    </td>
                    <td className="text-right px-2 text-muted-foreground">
                      {(avg(b.gold, b.games) / 1000).toFixed(1)}k
                    </td>
                    <td className="text-right px-2 text-muted-foreground">
                      {Math.round(avg(b.damage, b.games) / 1000)}k
                    </td>
                    <td className="text-right pl-2 text-muted-foreground">
                      {avg(b.vision, b.games).toFixed(0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
