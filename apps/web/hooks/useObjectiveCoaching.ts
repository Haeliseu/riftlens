import { useQuery } from "@tanstack/react-query"
import type { ObjectiveSummary } from "@/lib/objectives"

export function useObjectiveCoaching(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["coaching-objectives", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/coaching/objectives?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Objective coaching unavailable")
      return (await res.json()) as ObjectiveSummary | null
    },
    staleTime: 30 * 60_000,
    enabled: !!puuid,
  })
}
