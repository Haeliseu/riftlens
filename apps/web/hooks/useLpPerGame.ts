import { useQuery } from "@tanstack/react-query"
import type { LpPerGame } from "@/lib/profile-db"

export function useLpPerGame(puuid: string | null | undefined) {
  return useQuery({
    queryKey: ["lp-per-game", puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/lp-per-game?puuid=${puuid}`)
      if (!res.ok) throw new Error("LP per game unavailable")
      return (await res.json()) as LpPerGame
    },
    staleTime: 120_000,
    enabled: !!puuid,
  })
}
