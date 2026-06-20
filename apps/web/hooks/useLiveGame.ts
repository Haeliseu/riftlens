import { useQuery } from "@tanstack/react-query"

export interface LiveParticipant {
  puuid: string | null
  teamId: number
  championId: number
  name: string
  tier: string | null
  division: string | null
  lp: number | null
  recentWins: number
  recentLosses: number
  streak: number
  onFire: boolean
}

export interface LiveGameData {
  gameMode: string | null
  queueId: number | null
  gameLengthS: number
  participants: LiveParticipant[]
}

export function useLiveGame(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["live-game", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/live-game?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Live game unavailable")
      return (await res.json()) as LiveGameData | null
    },
    staleTime: 30_000,
    enabled: !!puuid,
  })
}
