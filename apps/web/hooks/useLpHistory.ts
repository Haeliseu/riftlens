import { useQuery } from "@tanstack/react-query"
import type { LpPoint } from "@/lib/profile-db"

export function useLpHistory(puuid: string | null | undefined, region = "EUW1", queueId = 420) {
  return useQuery({
    queryKey: ["lp-history", region, puuid, queueId],
    queryFn: async () => {
      const res = await fetch(
        `/api/riot/lp-history?puuid=${puuid}&region=${region}&queue=${queueId}`
      )
      if (!res.ok) throw new Error("LP history unavailable")
      return (await res.json()) as LpPoint[]
    },
    staleTime: 120_000,
    enabled: !!puuid,
  })
}
