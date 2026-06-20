import { useQuery } from "@tanstack/react-query"
import type { LpPoint } from "@/lib/profile-db"

export function useLpHistory(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["lp-history", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/lp-history?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("LP history unavailable")
      return (await res.json()) as LpPoint[]
    },
    staleTime: 120_000,
    enabled: !!puuid,
  })
}
