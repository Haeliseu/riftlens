import type { MatchSummary } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

/** Match summary enriched (server-side) with resolved spell/rune icon URLs. */
export interface EnrichedMatch extends MatchSummary {
  spellIcons: (string | null)[]
  keystoneIcon: string | null
  secondaryIcon: string | null
}

export function useMatchHistory(puuid: string | null | undefined, region = "EUW1", count = 10) {
  return useQuery({
    queryKey: ["match-history", region, puuid, count],
    queryFn: async () => {
      const res = await fetch(
        `/api/riot/match-history?puuid=${puuid}&region=${region}&count=${count}`
      )
      if (!res.ok) throw new Error("Match history unavailable")
      return (await res.json()) as EnrichedMatch[]
    },
    staleTime: 300_000,
    enabled: !!puuid,
  })
}
