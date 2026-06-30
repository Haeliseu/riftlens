import { useQuery } from "@tanstack/react-query"

export interface Rune {
  id: number
  key: string
  name: string
  icon: string
  shortDesc: string
  longDesc: string
}
export interface RuneTree {
  id: number
  key: string
  name: string
  icon: string
  slots: { runes: Rune[] }[]
}

export function useRunes(locale: string) {
  return useQuery({
    queryKey: ["runes", locale],
    queryFn: async () => {
      const versions = (await (
        await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      ).json()) as string[]
      const v = versions[0] ?? "15.13.1"
      const dl = locale === "fr" ? "fr_FR" : "en_US"
      const res = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${v}/data/${dl}/runesReforged.json`
      )
      if (!res.ok) throw new Error("Runes unavailable")
      return (await res.json()) as RuneTree[]
    },
    staleTime: 24 * 3_600_000,
  })
}
