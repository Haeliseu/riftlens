import { useQuery } from "@tanstack/react-query"
import type { CoachTip } from "@/lib/coaching"

export interface CoachingData {
  role: string
  games: number
  winRate: number
  tips: CoachTip[]
}

export function useCoaching(puuid: string | null | undefined) {
  return useQuery({
    queryKey: ["coaching", puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/coaching?puuid=${puuid}`)
      if (!res.ok) throw new Error("Coaching unavailable")
      return (await res.json()) as CoachingData | null
    },
    staleTime: 5 * 60_000,
    enabled: !!puuid,
  })
}
