import type { AverageGameRank } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export function useAverageRank(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["average-rank", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/average-rank?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Average rank unavailable")
      return (await res.json()) as AverageGameRank | null
    },
    staleTime: 600_000,
    enabled: !!puuid,
  })
}
