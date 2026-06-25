import type { PlayerTag } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export interface LiveParticipant {
  puuid: string | null
  teamId: number
  championId: number
  name: string
  spellIcons: (string | null)[]
  keystoneIcon: string | null
  tier: string | null
  division: string | null
  lp: number | null
  recentWins: number
  recentLosses: number
  streak: number
  onFire: boolean
  tags: PlayerTag[]
}

export interface LiveGameData {
  gameMode: string | null
  queueId: number | null
  gameLengthS: number
  participants: LiveParticipant[]
}

export function useLiveGame(
  puuid: string | null | undefined,
  region = "EUW1",
  // When the page already fetched the live game server-side, seed the cache so
  // the first paint shows data; react-query still refreshes once it goes stale.
  initialData?: LiveGameData | null
) {
  return useQuery({
    queryKey: ["live-game", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/live-game?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Live game unavailable")
      return (await res.json()) as LiveGameData | null
    },
    staleTime: 30_000,
    enabled: !!puuid,
    ...(initialData !== undefined ? { initialData } : {}),
  })
}
