"use client"

import { getProfileIconUrl, getRankIconUrl, type TierName } from "@riftlens/riot-api"
import { useI18n } from "@/lib/i18n"
import { regionBadge } from "@/lib/regions"
import { capitalizeTier, rankLabel, tierColor } from "@/lib/tiers"

interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
}

interface ProfileHeaderProps {
  region: string
  gameName: string
  tagLine: string
  profileIconId?: number | null
  summonerLevel?: number | null
  soloRank?: SoloRank | null
}

export function ProfileHeader({
  region,
  gameName,
  tagLine,
  profileIconId,
  summonerLevel,
  soloRank,
}: ProfileHeaderProps) {
  const { t } = useI18n()
  const rb = regionBadge(region)

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-14 h-14 flex-shrink-0">
        <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center text-xl font-semibold">
          {profileIconId != null ? (
            // biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed
            <img
              src={getProfileIconUrl(profileIconId)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            (gameName[0]?.toUpperCase() ?? "?")
          )}
        </div>
        {summonerLevel != null && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-md bg-background border px-1.5 text-[10px] font-medium whitespace-nowrap">
            {summonerLevel}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xl font-semibold">{gameName}</span>
          <span className="text-sm text-muted-foreground">#{tagLine}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: rb.color }}
          >
            {rb.label}
          </span>
        </div>
        {soloRank ? (
          <div className="flex items-center gap-2">
            {/* biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed */}
            <img
              src={getRankIconUrl(capitalizeTier(soloRank.tier) as TierName)}
              alt=""
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm font-medium" style={{ color: tierColor(soloRank.tier) }}>
              {rankLabel(t, soloRank.tier, soloRank.rank)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("history.lp", { value: soloRank.leaguePoints })}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("profile.unranked")}</span>
        )}
      </div>
    </div>
  )
}
