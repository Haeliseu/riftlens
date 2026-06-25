"use client"

import { ChevronRight } from "lucide-react"
import { useMatchTimeline } from "@/hooks/useMatchTimeline"
import { useI18n } from "@/lib/i18n"
import { diffColor, Icon, SKILL_COLOR, SKILL_LABEL } from "./shared"

export function BuildSkillOrder({
  matchId,
  region,
  puuid,
  oppPuuid,
  championId,
}: {
  matchId: string
  region: string
  puuid: string
  oppPuuid?: string | null
  championId?: number
}) {
  const { t } = useI18n()
  const { data, isLoading } = useMatchTimeline(matchId, region, puuid, true, oppPuuid, championId)
  if (isLoading) {
    return <p className="text-[11px] text-muted-foreground">{t("detail.loadingTimeline")}</p>
  }
  if (!data || (data.build.length === 0 && data.skills.length === 0)) return null

  // Skill order grid: for each of Q/W/E/R, mark the level numbers where it was leveled.
  const slotLevels: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
  data.skills.forEach((s, i) => {
    slotLevels[s.slot]?.push(i + 1)
  })
  const a = data.at15

  // Group items bought in the same shop visit (close timestamps) so they render
  // glued together, with chevrons only between distinct purchase moments.
  const BUY_WINDOW_MS = 3000
  const buildGroups: (typeof data.build)[] = []
  for (const b of data.build) {
    const g = buildGroups[buildGroups.length - 1]
    const prev = g?.[g.length - 1]
    if (g && prev && b.at - prev.at <= BUY_WINDOW_MS) g.push(b)
    else buildGroups.push([b])
  }

  return (
    <div className="space-y-4">
      {a && (
        <div>
          <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
            {t("detail.laning15")}{" "}
            {a.csDiff !== null && (
              <span className="font-normal normal-case text-muted-foreground">
                {t("detail.vsLaneOpp")}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">{t("detail.cs")} </span>
              <span className="font-medium">{a.cs}</span>
              {a.csDiff !== null && (
                <span className={`ml-1 text-xs ${diffColor(a.csDiff)}`}>
                  {a.csDiff > 0 ? "+" : ""}
                  {a.csDiff}
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">{t("detail.gold")} </span>
              <span className="font-medium">{(a.gold / 1000).toFixed(1)}k</span>
              {a.goldDiff !== null && (
                <span className={`ml-1 text-xs ${diffColor(a.goldDiff)}`}>
                  {a.goldDiff > 0 ? "+" : ""}
                  {a.goldDiff}
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">{t("detail.xp")} </span>
              <span className="font-medium">{a.xp}</span>
              {a.xpDiff !== null && (
                <span className={`ml-1 text-xs ${diffColor(a.xpDiff)}`}>
                  {a.xpDiff > 0 ? "+" : ""}
                  {a.xpDiff}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
          {t("detail.build")}
        </p>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {buildGroups.map((group, gi) => {
            const last = group[group.length - 1]
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: purchase-moment groups
              <div key={gi} className="flex items-center">
                <div className="flex flex-col items-center">
                  {/* items bought together, glued */}
                  <div className="flex gap-0.5">
                    {group.map((b, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: stacked same-moment items
                        key={`${b.itemId}-${i}`}
                        className="rounded-md ring-1 ring-border"
                      >
                        <Icon src={b.icon} size={28} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5">{last?.minute}'</span>
                </div>
                {gi < buildGroups.length - 1 && (
                  <ChevronRight className="mx-0.5 h-3 w-3 text-muted-foreground self-start mt-2" />
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold mb-2 uppercase text-muted-foreground">
          {t("detail.skillOrder")}
        </p>
        <div className="space-y-1">
          {[1, 2, 3, 4].map((slot) => (
            <div key={slot} className="flex items-center gap-1.5">
              <div className="relative flex-shrink-0">
                {data.spellIcons?.[slot - 1] ? (
                  <Icon src={data.spellIcons[slot - 1] ?? null} size={20} />
                ) : (
                  <span
                    className={`block w-5 text-center text-xs font-bold ${SKILL_COLOR[slot]?.text}`}
                  >
                    {SKILL_LABEL[slot]}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 18 }, (_, lvl) => {
                  const leveled = slotLevels[slot]?.includes(lvl + 1)
                  return (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: level number is the stable identity
                      key={`lvl-${lvl + 1}`}
                      className={`flex h-4 w-4 items-center justify-center rounded text-[8px] font-medium ${
                        leveled
                          ? `${SKILL_COLOR[slot]?.bg} text-white`
                          : "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {leveled ? lvl + 1 : ""}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
