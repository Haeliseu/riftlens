import { useQuery } from "@tanstack/react-query"

export interface MatchDetailParticipant {
  puuid: string
  gameName: string
  tagLine: string
  teamId: number
  championId: number
  championName: string
  win: boolean
  kills: number
  deaths: number
  assists: number
  cs: number
  goldEarned: number
  visionScore: number
  position: string
}

export interface MatchDetail {
  matchId: string
  region: string
  queueId: number | null
  gameDurationS: number
  participants: MatchDetailParticipant[]
}

export function useMatchDetail(matchId: string | null, region = "EUW1") {
  return useQuery({
    queryKey: ["match-detail", region, matchId],
    queryFn: async () => {
      const res = await fetch(`/api/riot/match/${matchId}?region=${region}`)
      if (!res.ok) throw new Error("Match detail unavailable")
      return (await res.json()) as MatchDetail
    },
    staleTime: 24 * 3_600_000,
    enabled: !!matchId,
  })
}
