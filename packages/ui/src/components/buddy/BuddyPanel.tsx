"use client"

import type { PlayerTag, PreviouslyPlayedInfo, TierName } from "@riftlens/riot-api"
import { BuddyCard } from "./BuddyCard"

export interface BuddyData {
  puuid: string
  summonerName: string
  tagLine: string
  tier: TierName
  division: string
  lp: number
  championName: string
  champWinRate: number
  champGames: number
  accountWinRate: number
  accountGames: number
  kda: string
  tags: PlayerTag[]
  previouslyPlayed?: PreviouslyPlayedInfo | null
  teamId: 100 | 200
  isSelf?: boolean
  sessionWins?: number
  sessionLosses?: number
}

interface BuddyPanelProps {
  buddies: BuddyData[]
  /** Navigation is provided by the host app (keeps this component framework-agnostic). */
  onPlayerClick?: (name: string, tag: string) => void
}

export function BuddyPanel({ buddies, onPlayerClick }: BuddyPanelProps) {
  const myTeam = buddies.filter((b) => b.teamId === 100)
  const enemyTeam = buddies.filter((b) => b.teamId === 200)

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Votre équipe
        </h3>
        {myTeam.map((buddy) => (
          <BuddyCard key={buddy.puuid} {...buddy} onPlayerClick={onPlayerClick} />
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Équipe ennemie
        </h3>
        {enemyTeam.map((buddy) => (
          <BuddyCard key={buddy.puuid} {...buddy} onPlayerClick={onPlayerClick} />
        ))}
      </div>
    </div>
  )
}
