import { useMemo } from "react"
import { isCurrentSeason, SEASON_2_2026_START_MS } from "@riftlens/riot-api"

export interface MatchFilters {
  period: "all" | "day" | "session"
  opponentPuuid?: string
  opponentRelation?: "ally" | "enemy" | "both"
  championName?: string
}

interface MatchLike {
  gameCreation: number
  win: boolean
  participantTeamId?: number
  opponentTeamId?: number
  opponentPuuid?: string
}

export function useMatchFilter<T extends MatchLike>(matches: T[], filters: MatchFilters): T[] {
  return useMemo(() => {
    let result = matches

    // Period filter
    if (filters.period === "day" || filters.period === "session") {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      result = result.filter((m) => m.gameCreation >= todayStart.getTime())
    }

    // Season filter always applied for "session"
    if (filters.period === "session") {
      result = result.filter((m) => isCurrentSeason(m.gameCreation))
    }

    // Opponent filter
    if (filters.opponentPuuid) {
      result = result.filter((m) => m.opponentPuuid === filters.opponentPuuid)

      if (filters.opponentRelation && filters.opponentRelation !== "both") {
        result = result.filter((m) => {
          const sameTeam = m.participantTeamId === m.opponentTeamId
          return filters.opponentRelation === "ally" ? sameTeam : !sameTeam
        })
      }
    }

    return result
  }, [matches, filters])
}
