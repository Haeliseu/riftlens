import { CURRENT_SEASON_LABEL } from "@riftlens/riot-api"
import { TierHex, tierColor } from "./TierHex"

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
  const color = soloRank ? tierColor(soloRank.tier) : "var(--color-muted-foreground)"

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Classé Solo / Duo</span>
        <span className="text-[10px] text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        {soloRank ? (
          <TierHex tier={soloRank.tier} size={40} />
        ) : (
          <div className="h-10 w-10 flex items-center justify-center text-2xl text-muted-foreground">
            —
          </div>
        )}
        <div>
          <p className="text-base font-semibold" style={{ color: soloRank ? color : undefined }}>
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
    </div>
  )
}
