import { useQuery } from "@tanstack/react-query"

export interface FeaturedParticipant {
  teamId: number
  championIcon: string
  spellIcons: (string | null)[]
  name: string
}
export interface FeaturedGame {
  gameId: number
  queueId: number | null
  gameMode: string | null
  gameLengthS: number
  participants: FeaturedParticipant[]
}

export function useFeaturedGames(region: string) {
  return useQuery({
    queryKey: ["featured-games", region],
    queryFn: async () => {
      const res = await fetch(`/api/riot/featured-games?region=${region}`)
      if (!res.ok) throw new Error("Featured games unavailable")
      return (await res.json()) as { region: string; games: FeaturedGame[] }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
