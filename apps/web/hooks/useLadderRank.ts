import { useQuery } from "@tanstack/react-query"

export interface LadderRank {
  rank: number | null
  apexTotal?: number
}

export function useLadderRank(puuid: string | null | undefined, region: string, tier: string) {
  return useQuery({
    queryKey: ["ladder-rank", region, puuid, tier],
    queryFn: async () => {
      const res = await fetch(`/api/riot/ladder-rank?puuid=${puuid}&region=${region}&tier=${tier}`)
      if (!res.ok) throw new Error("Ladder rank unavailable")
      return (await res.json()) as LadderRank
    },
    staleTime: 3_600_000,
    enabled: !!puuid,
  })
}
