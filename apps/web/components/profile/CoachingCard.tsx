"use client"

import { useCoaching } from "@/hooks/useCoaching"
import type { CoachMetric, CoachSeverity } from "@/lib/coaching"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { roleKey } from "@/lib/roles"

interface Props {
  puuid?: string | null
  /** sidebar mode: show only the issues, condensed */
  compact?: boolean
}

const SEVERITY: Record<CoachSeverity, { dot: string; text: string }> = {
  good: { dot: "bg-emerald-500", text: "text-emerald-500" },
  warn: { dot: "bg-amber-500", text: "text-amber-500" },
  bad: { dot: "bg-red-500", text: "text-red-500" },
}

const METRIC_KEY: Record<CoachMetric, TranslationKey> = {
  csPerMin: "coach.metric.csPerMin",
  vision: "coach.metric.vision",
  kp: "coach.metric.kp",
  deaths: "coach.metric.deaths",
  gold: "coach.metric.gold",
  dpm: "coach.metric.dpm",
}
const TIP_KEY: Record<CoachMetric, TranslationKey> = {
  csPerMin: "coach.tip.csPerMin",
  vision: "coach.tip.vision",
  kp: "coach.tip.kp",
  deaths: "coach.tip.deaths",
  gold: "coach.tip.gold",
  dpm: "coach.tip.dpm",
}

function fmt(metric: CoachMetric, v: number): string {
  return metric === "kp" ? `${v}%` : String(v)
}

export function CoachingCard({ puuid, compact }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useCoaching(puuid)

  const tips = data?.tips ?? []
  const issues = tips.filter((tip) => tip.severity !== "good")
  // Sidebar shows only the issues; the tab shows every metric.
  const shown = compact ? issues : tips

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-1">{t("coach.title")}</h3>
      {!puuid || (!isLoading && !data) ? (
        <p className="text-sm text-muted-foreground py-1">{t("coach.empty")}</p>
      ) : data ? (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {t("coach.subtitle", {
              role: t(roleKey(data.role)),
              games: data.games,
              wr: data.winRate,
            })}
          </p>
          {compact && issues.length === 0 ? (
            <p className="text-sm text-emerald-500">{t("coach.allGood")}</p>
          ) : (
            <div className="space-y-3">
              {shown.map((tip) => {
                const sev = SEVERITY[tip.severity]
                return (
                  <div key={tip.metric}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                      <span className="flex-1 truncate">{t(METRIC_KEY[tip.metric])}</span>
                      <span className={`font-semibold ${sev.text}`}>
                        {fmt(tip.metric, tip.value)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        / {fmt(tip.metric, tip.target)}
                      </span>
                    </div>
                    {tip.severity !== "good" && (
                      <p className="mt-1 ml-4 text-xs text-muted-foreground">
                        {t(TIP_KEY[tip.metric])}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
