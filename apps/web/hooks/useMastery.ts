import type { ChampionMastery } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export function useMastery(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["mastery", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/mastery?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Mastery unavailable")
      return (await res.json()) as ChampionMastery[]
    },
    staleTime: 3_600_000,
    enabled: !!puuid,
  })
}
