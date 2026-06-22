"use client"

import {
  CURRENT_SEASON_LABEL,
  getRankEmblemUrl,
  getRankIconUrl,
  type TierName,
} from "@riftlens/riot-api"
import { useAverageRank } from "@/hooks/useAverageRank"
import { useLadderRank } from "@/hooks/useLadderRank"
import { useLpHistory } from "@/hooks/useLpHistory"
import { useI18n } from "@/lib/i18n"
import type { LpPoint } from "@/lib/profile-db"
import { capitalizeTier, rankLabel, tierColor } from "@/lib/tiers"
import { LpChart } from "./LpChart"

export interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

interface RankedCardProps {
  region: string
  puuid?: string | null
  soloRank?: SoloRank | null
}

const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"])

/** LP change over the last `days` days, from accumulated snapshots. */
function lpDelta(points: LpPoint[], days: number): number | null {
  if (points.length < 2) return null
  const cutoff = Date.now() - days * 86_400_000
  const current = points[points.length - 1]?.value ?? 0
  const before = points.filter((p) => new Date(p.recordedAt).getTime() <= cutoff)
  const baseline =
    before.length > 0 ? (before[before.length - 1]?.value ?? 0) : (points[0]?.value ?? 0)
  return current - baseline
}

function DeltaPill({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const color = value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-muted-foreground"
  const sign = value > 0 ? "+" : ""
  return (
    <span className="text-xs">
      <span className="text-muted-foreground">{label} </span>
      <span className={`font-medium ${color}`}>
        {sign}
        {value} LP
      </span>
    </span>
  )
}

export function RankedCard({ region, puuid, soloRank }: RankedCardProps) {
  const { t } = useI18n()
  const { data: avg, isLoading: avgLoading } = useAverageRank(puuid, region)
  const { data: lpHistory } = useLpHistory(puuid, region)
  const isApex = soloRank ? APEX.has(soloRank.tier) : false
  const { data: ladder } = useLadderRank(isApex ? puuid : null, region, soloRank?.tier ?? "")
  const points = lpHistory ?? []
  const d7 = lpDelta(points, 7)
  const d30 = lpDelta(points, 30)

  const label = soloRank ? rankLabel(t, soloRank.tier, soloRank.rank) : t("profile.unranked")
  const games = soloRank ? soloRank.wins + soloRank.losses : 0
  const winRate = games > 0 ? Math.round(((soloRank?.wins ?? 0) / games) * 100) : null
  const color = soloRank ? tierColor(soloRank.tier) : undefined

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{t("ranked.title")}</span>
        <span className="text-[10px] text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
      </div>

      <div className="flex items-center gap-4 mb-2">
        {soloRank ? (
          <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden">
            {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
            <img
              src={getRankEmblemUrl(capitalizeTier(soloRank.tier) as TierName)}
              alt=""
              className="absolute inset-0 h-full w-full object-contain scale-[3.4] drop-shadow"
            />
          </div>
        ) : (
          <div className="h-28 w-28 flex items-center justify-center text-5xl text-muted-foreground">
            —
          </div>
        )}
        <div>
          <p className="text-xl font-bold" style={{ color }}>
            {label}
          </p>
          {soloRank && (
            <p className="text-sm text-muted-foreground font-mono">
              {t("history.lp", { value: soloRank.leaguePoints })}
            </p>
          )}
        </div>
      </div>

      {winRate != null && soloRank && (
        <>
          <p className="text-xs text-muted-foreground mb-1.5">
            {t("ranked.wlLine", {
              wins: soloRank.wins,
              losses: soloRank.losses,
              wr: winRate ?? 0,
              games,
            })}
          </p>
          {/* LP progress within the division: 10 LP = 10% */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, soloRank.leaguePoints)}%`, backgroundColor: color }}
            />
          </div>
        </>
      )}

      {/* Rang moyen des parties = médiane des rangs des participants (≈ MMR) */}
      {soloRank && (
        <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-1">{t("ranked.avgGameRank")}</p>
          {avgLoading ? (
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          ) : avg ? (
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
              <img src={getRankIconUrl(avg.tier)} alt="" className="w-7 h-7 object-contain" />
              <span className="text-sm font-medium" style={{ color: tierColor(avg.tier) }}>
                {rankLabel(t, avg.tier, avg.division)}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {t("ranked.lastN", { n: avg.sampleGames })}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      )}

      {(ladder?.rank != null || d7 !== null || d30 !== null) && (
        <div className="mt-3 space-y-1">
          {ladder?.rank != null && (
            <p className="text-xs">
              <span className="text-muted-foreground">{t("ranked.ladderRank")} </span>
              <span className="font-semibold">#{ladder.rank.toLocaleString()}</span>
            </p>
          )}
          {(d7 !== null || d30 !== null) && (
            <div className="flex items-center gap-3">
              <DeltaPill label={t("ranked.delta30")} value={d30} />
              <DeltaPill label={t("ranked.delta7")} value={d7} />
            </div>
          )}
        </div>
      )}

      <LpChart embedded puuid={puuid ?? null} region={region} />
    </div>
  )
}
