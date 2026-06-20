import Image from "next/image"
import { CURRENT_SEASON_LABEL, getRankIconUrl } from "@riftlens/riot-api"
import type { TierName } from "@riftlens/riot-api"

interface RankedCardProps {
  region: string
  gameName: string
  tagLine: string
}

// Data is fetched client-side via hooks in production
// This is the presentational shell
export function RankedCard({ region, gameName, tagLine }: RankedCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Classé Solo/Duo</span>
        <span className="text-xs text-muted-foreground">{CURRENT_SEASON_LABEL}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">—</span>
        </div>
        <div>
          <p className="font-semibold">Non classé</p>
          <p className="text-sm text-muted-foreground">0 LP</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">WR Saison</span>
          <span>—</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Peak</span>
          <span>—</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Rang moyen des parties</span>
          <span>—</span>
        </div>
      </div>
    </div>
  )
}
