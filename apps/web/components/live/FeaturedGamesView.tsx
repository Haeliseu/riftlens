"use client"

import { Radio } from "lucide-react"
import { useState } from "react"
import {
  type FeaturedGame,
  type FeaturedParticipant,
  useFeaturedGames,
} from "@/hooks/useFeaturedGames"
import { useQueues } from "@/hooks/useQueues"
import { useI18n } from "@/lib/i18n"
import { queueKey } from "@/lib/queues"
import { REGION_IDS, regionBadge } from "@/lib/regions"

function Champ({ p }: { p: FeaturedParticipant }) {
  return (
    <div className="relative">
      {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
      <img src={p.championIcon} alt="" className="h-9 w-9 rounded-md border" loading="lazy" />
      <div className="absolute -bottom-1 -left-1 flex flex-col gap-px">
        {p.spellIcons.map((s, i) =>
          s ? (
            // biome-ignore lint/performance/noImgElement: external CDN icon
            <img
              key={`${i}-${s}`}
              src={s}
              alt=""
              className="h-3 w-3 rounded-sm border border-black/40"
            />
          ) : null
        )}
      </div>
    </div>
  )
}

export function FeaturedGamesView({ initialRegion = "EUW1" }: { initialRegion?: string }) {
  const { t, locale } = useI18n()
  const [region, setRegion] = useState(initialRegion)
  const { data, isLoading, isError } = useFeaturedGames(region)
  const { data: queues } = useQueues(locale)

  const label = (g: FeaturedGame) => {
    const k = queueKey(g.queueId, g.gameMode)
    return k !== "queue.other"
      ? t(k)
      : ((g.queueId != null ? queues?.[g.queueId] : undefined) ?? t(k))
  }

  return (
    <div className="space-y-4">
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="h-9 rounded-md border bg-card px-3 text-sm"
      >
        {REGION_IDS.map((id) => (
          <option key={id} value={id}>
            {regionBadge(id).label}
          </option>
        ))}
      </select>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("featured.unavailable")}</p>
      ) : !data || data.games.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("featured.empty")}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.games.map((g) => {
            const blue = g.participants.filter((p) => p.teamId === 100)
            const red = g.participants.filter((p) => p.teamId === 200)
            return (
              <div key={g.gameId} className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 animate-pulse text-green-500" />
                  <span className="text-sm font-medium">{label(g)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("live.since", { min: Math.floor(g.gameLengthS / 60) })}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {blue.map((p, i) => (
                      <Champ key={`b-${g.gameId}-${i}`} p={p} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {red.map((p, i) => (
                      <Champ key={`r-${g.gameId}-${i}`} p={p} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
