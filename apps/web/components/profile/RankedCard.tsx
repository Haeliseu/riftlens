"use client"

import { CURRENT_SEASON_LABEL, getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { useAverageRank } from "@/hooks/useAverageRank"
import { capitalizeTier, rankLabelFr, tierColor } from "@/lib/tiers"

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

export function RankedCard({ region, puuid, soloRank }: RankedCardProps) {
  const { data: avg, isLoading: avgLoading } = useAverageRank(puuid, region)

  const label = soloRank ? rankLabelFr(soloRank.tier, soloRank.rank) : "Non classé"
  const games = soloRank ? soloRank.wins + soloRank.losses : 0
  const winRate = games > 0 ? Math.round(((soloRank?.wins ?? 0) / games) * 100) : null
  const color = soloRank ? tierColor(soloRank.tier) : undefined

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Classé Solo / Duo</span>
        <span className="text-[10px] text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        {soloRank ? (
          // biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed
          <img
            src={getRankIconUrl(capitalizeTier(soloRank.tier) as TierName)}
            alt=""
            className="w-12 h-12 object-contain flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 flex items-center justify-center text-2xl text-muted-foreground">
            —
          </div>
        )}
        <div>
          <p className="text-base font-semibold" style={{ color }}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {soloRank ? soloRank.leaguePoints : 0} LP
          </p>
        </div>
      </div>

      {winRate != null && soloRank && (
        <>
          <p className="text-xs text-muted-foreground mb-1.5">
            {soloRank.wins}V · {soloRank.losses}D ·{" "}
            <span className="text-foreground font-medium">{winRate}% WR</span> · {games} games
          </p>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${winRate}%`, backgroundColor: color }}
            />
          </div>
        </>
      )}

      {/* Rang moyen des parties = médiane des rangs des participants (≈ MMR) */}
      {soloRank && (
        <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-[10px] text-muted-foreground mb-1">Rang moyen des parties</p>
          {avgLoading ? (
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          ) : avg ? (
            <div className="flex items-center gap-2">
              {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
              <img src={getRankIconUrl(avg.tier)} alt="" className="w-5 h-5 object-contain" />
              <span className="text-sm font-medium" style={{ color: tierColor(avg.tier) }}>
                {rankLabelFr(avg.tier, avg.division)}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {avg.sampleGames} dernières
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      )}
    </div>
  )
}
