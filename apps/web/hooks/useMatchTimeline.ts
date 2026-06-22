import { useQuery } from "@tanstack/react-query"

export interface LaningAt15 {
  cs: number
  gold: number
  xp: number
  csDiff: number | null
  goldDiff: number | null
  xpDiff: number | null
}

export interface MatchTimelineData {
  build: { itemId: number; icon: string | null; minute: number }[]
  skills: { slot: number; minute: number }[]
  at15: LaningAt15 | null
}

export function useMatchTimeline(
  matchId: string | null,
  region: string,
  puuid: string | null | undefined,
  enabled: boolean,
  oppPuuid?: string | null
) {
  return useQuery({
    queryKey: ["match-timeline", region, matchId, puuid, oppPuuid],
    queryFn: async () => {
      const opp = oppPuuid ? `&opp=${oppPuuid}` : ""
      const res = await fetch(
        `/api/riot/match/${matchId}/timeline?region=${region}&puuid=${puuid}${opp}`
      )
      if (!res.ok) throw new Error("Timeline unavailable")
      return (await res.json()) as MatchTimelineData
    },
    staleTime: 24 * 3_600_000,
    enabled: enabled && !!matchId && !!puuid,
  })
}
