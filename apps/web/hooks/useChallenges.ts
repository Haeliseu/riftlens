import type { PlayerChallenges } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export function useChallenges(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["challenges", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/challenges?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Challenges unavailable")
      return (await res.json()) as PlayerChallenges
    },
    staleTime: 3_600_000,
    enabled: !!puuid,
  })
}
