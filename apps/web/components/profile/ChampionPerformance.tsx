"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useState } from "react"
import { useChampionStats } from "@/hooks/useChampionStats"
import { useLpPerGame } from "@/hooks/useLpPerGame"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import type { ChampDetailBucket } from "@/lib/profile-db"

interface Props {
  puuid?: string | null
  region: string
}

type Mode = "solo" | "flex" | "aram" | "arena"

const TABS: { id: Mode; label: TranslationKey }[] = [
  { id: "solo", label: "champStats.tab.solo" },
  { id: "flex", label: "champStats.tab.flex" },
  { id: "aram", label: "queue.450" },
  { id: "arena", label: "queue.1700" },
]

function avg(sum: number, games: number): number {
  return games > 0 ? sum / games : 0
}

function kda(b: ChampDetailBucket): string {
  const r = b.deaths === 0 ? b.kills + b.assists : (b.kills + b.assists) / b.deaths
  return r.toFixed(2)
}

/** Net LP on a champion: blue up arrow when positive, red down arrow when negative. */
function LpCell({ value }: { value: number | undefined }) {
  if (!value) return <span className="w-14 text-right text-muted-foreground">—</span>
  const up = value > 0
  const Arrow = up ? ArrowUp : ArrowDown
  return (
    <span
      className={`w-14 flex items-center justify-end gap-0.5 font-medium tabular-nums ${
        up ? "text-blue-500" : "text-red-500"
      }`}
    >
      <Arrow className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {value}
    </span>
  )
}

export function ChampionPerformance({ puuid, region }: Props) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>("solo")
  const { data, isLoading } = useChampionStats(puuid, region)
  const { data: lp } = useLpPerGame(puuid)
  // Net LP is only tracked for Solo/Duo (queue 420), like the per-game LP.
  const showLp = mode === "solo"
  const champs = (data ?? [])
    .filter((c) => c[mode].games > 0)
    .sort((a, b) => b[mode].games - a[mode].games)
    .slice(0, 6)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-base font-semibold">{t("champPerf.title")}</h3>
        <div className="flex rounded-md bg-muted p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`px-2 py-0.5 text-[11px] rounded ${
                mode === tab.id ? "bg-background font-medium" : "text-muted-foreground"
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>
      {!puuid || (!isLoading && champs.length === 0) ? (
        <p className="text-sm text-muted-foreground py-1">{t("champStats.empty")}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground uppercase">
            <span className="flex-1">{t("champStats.col.champion")}</span>
            <span className="w-12 text-right">{t("roles.col.games")}</span>
            <span className="w-14 text-right">{t("champStats.col.kda")}</span>
            <span className="w-14 text-right">{t("champStats.col.csPerMin")}</span>
            {showLp && <span className="w-14 text-right">{t("champStats.col.lp")}</span>}
            <span className="w-12 text-right">{t("champStats.col.wr")}</span>
          </div>
          {champs.map((c) => {
            const b = c[mode]
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
                <span className="w-12 text-right text-muted-foreground">{b.games}</span>
                <span className="w-14 text-right font-medium">{kda(b)}</span>
                <span className="w-14 text-right text-muted-foreground">
                  {avg(b.csPerMin, b.games).toFixed(1)}
                </span>
                {showLp && <LpCell value={lp?.byChampion[c.championId]} />}
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
