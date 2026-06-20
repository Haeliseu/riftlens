"use client"

import { useRouter } from "next/navigation"

interface MatchHistoryProps {
  region: string
  gameName: string
  tagLine: string
  opponentPuuid?: string
  opponentRelation?: "ally" | "enemy" | "both"
  period?: "all" | "day" | "session"
}

// In production this fetches via TanStack Query
export function MatchHistory({
  region,
  gameName,
  tagLine,
  opponentPuuid,
  period: _period,
}: MatchHistoryProps) {
  const router = useRouter()

  function _handleOpponentFilter(puuid: string) {
    router.push(
      `/profile/${region}/${encodeURIComponent(gameName)}/${tagLine}?opponent=${puuid}&relation=both`,
      { scroll: false }
    )
  }

  return (
    <div className="space-y-2">
      {opponentPuuid && (
        <div className="flex items-center gap-2 rounded-md border bg-accent/50 px-3 py-2 text-sm">
          <span>Filtre : parties avec/contre ce joueur</span>
          <button
            type="button"
            onClick={() =>
              router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${tagLine}`)
            }
            className="ml-auto text-xs underline"
          >
            Effacer
          </button>
        </div>
      )}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm text-center py-8">
          Chargement de l'historique…
        </p>
      </div>
    </div>
  )
}
