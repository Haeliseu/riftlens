import { useQuery } from "@tanstack/react-query"
import type { CrossedPlayer, RolePerf } from "@/lib/profile-db"

export function useRolePerformance(puuid: string | null | undefined) {
  return useQuery({
    queryKey: ["role-performance", puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/role-performance?puuid=${puuid}`)
      if (!res.ok) throw new Error("Role performance unavailable")
      return (await res.json()) as RolePerf[]
    },
    staleTime: 120_000,
    enabled: !!puuid,
  })
}

export function useCrossedPlayers(puuid: string | null | undefined, region = "EUW1") {
  return useQuery({
    queryKey: ["crossed-players", puuid, region],
    queryFn: async () => {
      const res = await fetch(`/api/riot/crossed-players?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Crossed players unavailable")
      return (await res.json()) as CrossedPlayer[]
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    enabled: !!puuid,
  })
}
