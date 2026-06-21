import { useQuery } from "@tanstack/react-query"
import type { ChampionDetail } from "@/lib/profile-db"

export function useChampionStats(puuid: string | null | undefined, region = "EUW1", count = 30) {
  return useQuery({
    queryKey: ["champion-stats", region, puuid, count],
    queryFn: async () => {
      const res = await fetch(
        `/api/riot/champion-stats?puuid=${puuid}&region=${region}&count=${count}`
      )
      if (!res.ok) throw new Error("Champion stats unavailable")
      return (await res.json()) as ChampionDetail[]
    },
    staleTime: 300_000,
    enabled: !!puuid,
  })
}
