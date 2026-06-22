"use client"

import { useQuery } from "@tanstack/react-query"
import { useI18n } from "@/lib/i18n"
import { PING_BY_KEY, pingIconUrl } from "@/lib/pings"

interface Props {
  puuid?: string | null
}

interface PingStatsData {
  total: number
  byKey: { key: string; count: number }[]
}

function usePingStats(puuid: string | null | undefined) {
  return useQuery({
    queryKey: ["ping-stats", puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/ping-stats?puuid=${puuid}`)
      if (!res.ok) throw new Error("Ping stats unavailable")
      return (await res.json()) as PingStatsData
    },
    staleTime: 120_000,
    enabled: !!puuid,
  })
}

export function PingStats({ puuid }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = usePingStats(puuid)
  const rows = (data?.byKey ?? []).filter((r) => PING_BY_KEY[r.key])

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">{t("pings.titleUsed")}</h3>
        {data && data.total > 0 && (
          <span className="text-sm text-muted-foreground">
            {t("pings.total", { n: data.total })}
          </span>
        )}
      </div>
      {!puuid || (!isLoading && rows.length === 0) ? (
        <p className="text-sm text-muted-foreground py-1">{t("pings.syncHint")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map((r) => {
            const f = PING_BY_KEY[r.key]
            if (!f) return null
            return (
              <div key={r.key} className="flex items-center gap-2" title={f.label}>
                {/* biome-ignore lint/performance/noImgElement: external CDN icon */}
                <img src={pingIconUrl(f.icon)} alt={f.label} className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate flex-1">{f.label}</span>
                <span className="text-sm font-medium">{r.count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
