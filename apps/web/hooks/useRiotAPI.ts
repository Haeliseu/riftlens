import { useQuery } from "@tanstack/react-query"

export function useRiotAccount(gameName: string, tagLine: string, region = "EUW1") {
  return useQuery({
    queryKey: ["account", region, gameName, tagLine],
    queryFn: async () => {
      const res = await fetch(
        `/api/riot/account?gameName=${encodeURIComponent(gameName)}&tagLine=${tagLine}&region=${region}`
      )
      if (!res.ok) throw new Error("Account not found")
      return res.json() as Promise<{ puuid: string; gameName: string; tagLine: string }>
    },
    staleTime: 3_600_000,
  })
}

export function useRiotRanked(summonerId: string, region = "EUW1") {
  return useQuery({
    queryKey: ["ranked", region, summonerId],
    queryFn: async () => {
      const res = await fetch(`/api/riot/ranked?summonerId=${summonerId}&region=${region}`)
      if (!res.ok) throw new Error("Ranked data unavailable")
      return res.json()
    },
    staleTime: 300_000,
    enabled: !!summonerId,
  })
}
