import { CURRENT_SEASON_LABEL, getRankIconUrl, type TierName } from "@riftlens/riot-api"

export interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

interface RankedCardProps {
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

export function RankedCard({ soloRank }: RankedCardProps) {
  const tierFr = soloRank ? (RANK_FR[soloRank.tier] ?? soloRank.tier) : null
  const label =
    soloRank && tierFr
      ? APEX.has(soloRank.tier)
        ? tierFr
        : `${tierFr} ${soloRank.rank}`
      : "Non classé"
  const games = soloRank ? soloRank.wins + soloRank.losses : 0
  const winRate = games > 0 ? Math.round(((soloRank?.wins ?? 0) / games) * 100) : null

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Classé Solo/Duo</span>
        <span className="text-xs text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center">
          {soloRank ? (
            // biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed
            <img
              src={getRankIconUrl(
                ((soloRank.tier[0] ?? "") + soloRank.tier.slice(1).toLowerCase()) as TierName
              )}
              alt=""
              className="h-20 w-20 object-contain"
            />
          ) : (
            <span className="text-3xl text-muted-foreground">—</span>
          )}
        </div>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">{soloRank ? soloRank.leaguePoints : 0} LP</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">WR Saison</span>
          <span>
            {winRate != null ? `${winRate}% (${soloRank?.wins}V ${soloRank?.losses}D)` : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Parties</span>
          <span>{games > 0 ? games : "—"}</span>
        </div>
      </div>
    </div>
  )
}
