import { useQuery } from "@tanstack/react-query"

export function useSummoner(puuid: string, region = "EUW1") {
  return useQuery({
    queryKey: ["summoner", region, puuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/summoner?puuid=${puuid}&region=${region}`)
      if (!res.ok) throw new Error("Summoner not found")
      return res.json()
    },
    staleTime: 3_600_000,
    enabled: !!puuid,
  })
}
