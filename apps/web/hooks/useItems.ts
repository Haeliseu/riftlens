import { useQuery } from "@tanstack/react-query"

export interface DdItem {
  id: string
  name: string
  description: string
  plaintext: string
  gold: { total: number; sell: number; purchasable: boolean }
  from?: string[]
  tags: string[]
  maps: Record<string, boolean>
  image: { full: string }
  stats: Record<string, number>
}

export function useItems(locale: string) {
  return useQuery({
    queryKey: ["items", locale],
    queryFn: async () => {
      const versions = (await (
        await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      ).json()) as string[]
      const version = versions[0] ?? "15.13.1"
      const dl = locale === "fr" ? "fr_FR" : "en_US"
      const res = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/${dl}/item.json`
      )
      if (!res.ok) throw new Error("Items unavailable")
      const data = (await res.json()).data as Record<string, Omit<DdItem, "id">>
      const items = Object.entries(data)
        .map(([id, it]) => ({ id, ...it }))
        // Purchasable Summoner's Rift items only (drop trinkets/ARAM/jungle-only).
        .filter((it) => it.gold?.purchasable && it.gold.total > 0 && it.maps?.["11"])
        .sort((a, b) => a.gold.total - b.gold.total)
      return { version, items }
    },
    staleTime: 24 * 3_600_000,
  })
}
