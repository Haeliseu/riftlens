"use client"

import { getChampionIconUrl } from "@riftlens/riot-api"
import { useChampions } from "@/hooks/useChampions"
import { useMastery } from "@/hooks/useMastery"
import { useI18n } from "@/lib/i18n"

interface Props {
  puuid?: string | null
  region: string
}

function points(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export function MasteryCard({ puuid, region }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useMastery(puuid, region)
  const { data: champions } = useChampions()
  const nameOf = new Map((champions ?? []).map((c) => [c.id, c.name]))
  const top = (data ?? []).slice(0, 15)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-3">{t("mastery.title")}</h3>
      {!puuid || (!isLoading && top.length === 0) ? (
        <p className="text-sm text-muted-foreground py-1">{t("mastery.empty")}</p>
      ) : (
        <div className="space-y-2">
          {top.map((m) => (
            <div key={m.championId} className="flex items-center gap-2.5 text-sm">
              <div className="relative flex-shrink-0">
                {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                <img src={getChampionIconUrl(m.championId)} alt="" className="h-8 w-8 rounded" />
                <span className="absolute -bottom-1 -right-1 rounded bg-background border px-0.5 text-[9px] font-bold leading-none">
                  {m.championLevel}
                </span>
              </div>
              <span className="flex-1 truncate font-medium">
                {nameOf.get(m.championId) ?? `#${m.championId}`}
              </span>
              <span className="text-muted-foreground">{points(m.championPoints)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
