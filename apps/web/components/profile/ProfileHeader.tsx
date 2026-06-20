import { CURRENT_SEASON_LABEL, getProfileIconUrl } from "@riftlens/riot-api"
import { regionBadge } from "@/lib/regions"
import { TierHex, tierColor } from "./TierHex"

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

const RANK_FR: Record<string, string> = {
  IRON: "Fer",
  BRONZE: "Bronze",
  SILVER: "Argent",
  GOLD: "Or",
  PLATINUM: "Platine",
  EMERALD: "Émeraude",
  DIAMOND: "Diamant",
  MASTER: "Maître",
  GRANDMASTER: "Grand Maître",
  CHALLENGER: "Challenger",
}

const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"])

export function ProfileHeader({
  region,
  gameName,
  tagLine,
  profileIconId,
  summonerLevel,
  soloRank,
}: ProfileHeaderProps) {
  const rb = regionBadge(region)
  const rankLabel = soloRank
    ? APEX.has(soloRank.tier)
      ? (RANK_FR[soloRank.tier] ?? soloRank.tier)
      : `${RANK_FR[soloRank.tier] ?? soloRank.tier} ${soloRank.rank}`
    : null

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
          <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-accent-foreground border">
            {CURRENT_SEASON_LABEL}
          </span>
        </div>
        {soloRank ? (
          <div className="flex items-center gap-2">
            <TierHex tier={soloRank.tier} size={18} />
            <span className="text-sm font-medium" style={{ color: tierColor(soloRank.tier) }}>
              {rankLabel}
            </span>
            <span className="text-xs text-muted-foreground">{soloRank.leaguePoints} LP</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Non classé</span>
        )}
      </div>
    </div>
  )
}
