import type { ChampionRotation } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export function useChampionRotation(region = "EUW1") {
  return useQuery({
    queryKey: ["champion-rotation", region],
    queryFn: async () => {
      const res = await fetch(`/api/riot/champion-rotation?region=${region}`)
      if (!res.ok) throw new Error("Champion rotation unavailable")
      return (await res.json()) as ChampionRotation
    },
    staleTime: 6 * 3_600_000,
  })
}
