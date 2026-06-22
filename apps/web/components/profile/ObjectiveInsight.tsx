"use client"

import { useObjectiveCoaching } from "@/hooks/useObjectiveCoaching"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import type { ObjectiveSummary } from "@/lib/objectives"

interface Props {
  puuid?: string | null
  region: string
}

const SEVERITY: Record<ObjectiveSummary["severity"], { text: string; msg: TranslationKey }> = {
  good: { text: "text-emerald-500", msg: "coach.obj.good" },
  warn: { text: "text-amber-500", msg: "coach.obj.warn" },
  bad: { text: "text-red-500", msg: "coach.obj.bad" },
}

export function ObjectiveInsight({ puuid, region }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useObjectiveCoaching(puuid, region)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-2">{t("coach.obj.title")}</h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : !data || data.deaths === 0 ? (
        <p className="text-sm text-muted-foreground">{t("coach.obj.empty")}</p>
      ) : (
        <ObjectiveBody data={data} t={t} />
      )}
    </div>
  )
}

function ObjectiveBody({
  data,
  t,
}: {
  data: ObjectiveSummary
  t: ReturnType<typeof useI18n>["t"]
}) {
  const sev = SEVERITY[data.severity]
  const pct = Math.round(data.ratio * 100)
  return (
    <div className="space-y-2">
      <p className="text-sm">
        {t("coach.obj.stat", { near: data.deathsNearLostObjective, deaths: data.deaths, pct })}
      </p>
      <p className={`text-sm font-medium ${sev.text}`}>{t(sev.msg)}</p>
      <p className="text-xs text-muted-foreground">{t("coach.obj.games", { n: data.games })}</p>
    </div>
  )
}
