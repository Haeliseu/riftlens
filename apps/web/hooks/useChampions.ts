import { useQuery } from "@tanstack/react-query"

export interface ChampionSummary {
  id: number
  name: string
  alias: string
}

const URL =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json"

export function useChampions() {
  return useQuery({
    queryKey: ["champion-summary"],
    queryFn: async () => {
      const res = await fetch(URL)
      if (!res.ok) throw new Error("Champion list unavailable")
      const all = (await res.json()) as ChampionSummary[]
      // id -1 is the "None" placeholder.
      return all.filter((c) => c.id > 0).sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: 24 * 3_600_000,
  })
}
