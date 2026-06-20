import { useQuery } from "@tanstack/react-query"

export interface MatchTimelineData {
  build: { itemId: number; icon: string | null; minute: number }[]
  skills: { slot: number; minute: number }[]
}

export function useMatchTimeline(
  matchId: string | null,
  region: string,
  puuid: string | null | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["match-timeline", region, matchId, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/match/${matchId}/timeline?region=${region}&puuid=${puuid}`)
      if (!res.ok) throw new Error("Timeline unavailable")
      return (await res.json()) as MatchTimelineData
    },
    staleTime: 24 * 3_600_000,
    enabled: enabled && !!matchId && !!puuid,
  })
}
