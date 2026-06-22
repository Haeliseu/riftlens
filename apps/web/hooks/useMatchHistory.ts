import type { MatchSummary } from "@riftlens/riot-api"
import { useInfiniteQuery } from "@tanstack/react-query"

/** Match summary enriched (server-side) with resolved item/spell/rune icon URLs. */
export interface EnrichedMatch extends MatchSummary {
  itemIcons: (string | null)[]
  spellIcons: (string | null)[]
  keystoneIcon: string | null
  secondaryIcon: string | null
}

const PAGE = 20

/** Paginated match history (match-v5 `start` offset) — load as many pages as wanted. */
export function useMatchHistory(
  puuid: string | null | undefined,
  region = "EUW1",
  queueId?: number
) {
  return useInfiniteQuery({
    queryKey: ["match-history", region, puuid, queueId ?? "all"],
    queryFn: async ({ pageParam }) => {
      const q = queueId ? `&queue=${queueId}` : ""
      const res = await fetch(
        `/api/riot/match-history?puuid=${puuid}&region=${region}&count=${PAGE}&start=${pageParam}${q}`
      )
      if (!res.ok) throw new Error("Match history unavailable")
      return (await res.json()) as EnrichedMatch[]
    },
    initialPageParam: 0,
    // Another page likely exists if this one came back full.
    getNextPageParam: (last, all) => (last.length >= PAGE ? all.length * PAGE : undefined),
    staleTime: 300_000,
    enabled: !!puuid,
  })
}
