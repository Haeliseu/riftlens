import type { ChampionAggregate } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export function useChampionStats(puuid: string | null | undefined, region = "EUW1", count = 30) {
  return useQuery({
    queryKey: ["champion-stats", region, puuid, count],
    queryFn: async () => {
      const res = await fetch(
        `/api/riot/champion-stats?puuid=${puuid}&region=${region}&count=${count}`
      )
      if (!res.ok) throw new Error("Champion stats unavailable")
      return (await res.json()) as ChampionAggregate[]
    },
    staleTime: 300_000,
    enabled: !!puuid,
  })
}
