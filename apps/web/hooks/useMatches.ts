import { useQuery } from "@tanstack/react-query"

export function useMatches(puuid: string, region = "EUW1", count = 20) {
  return useQuery({
    queryKey: ["matches", region, puuid, count],
    queryFn: async () => {
      const res = await fetch(`/api/riot/matches?puuid=${puuid}&region=${region}&count=${count}`)
      if (!res.ok) throw new Error("Matches unavailable")
      return res.json() as Promise<string[]>
    },
    staleTime: 300_000,
    enabled: !!puuid,
  })
}
