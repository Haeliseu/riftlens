"use client"

import { useChallenges } from "@/hooks/useChallenges"
import { useI18n } from "@/lib/i18n"
import { tierColor } from "@/lib/tiers"

interface Props {
  puuid?: string | null
  region: string
}

export function ChallengesCard({ puuid, region }: Props) {
  const { t } = useI18n()
  const { data, isLoading } = useChallenges(puuid, region)
  const total = data?.totalPoints

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-base font-semibold mb-3">{t("challenges.title")}</h3>
      {!puuid || (!isLoading && !total) ? (
        <p className="text-sm text-muted-foreground py-1">{t("challenges.empty")}</p>
      ) : total ? (
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: tierColor(total.level) }}>
              {total.current.toLocaleString()}
            </p>
            <p
              className="text-xs uppercase font-semibold"
              style={{ color: tierColor(total.level) }}
            >
              {total.level}
            </p>
          </div>
          <div className="flex-1 text-sm text-muted-foreground space-y-1">
            <p>
              {total.current.toLocaleString()} / {total.max.toLocaleString()}{" "}
              {t("challenges.points")}
            </p>
            {total.percentile != null && (
              <p className="text-xs">
                {t("challenges.percentile", { n: (total.percentile * 100).toFixed(1) })}
              </p>
            )}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${total.max > 0 ? Math.min(100, (total.current / total.max) * 100) : 0}%`,
                  backgroundColor: tierColor(total.level),
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
