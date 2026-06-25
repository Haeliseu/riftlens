import { useQuery } from "@tanstack/react-query"

/**
 * Queue id → display name from CommunityDragon (version-free, auto-updated).
 * Used as a fallback for queue ids our curated table doesn't cover, so new or
 * rotating modes show a real name instead of "Other".
 */
export function useQueues(locale: string) {
  return useQuery({
    queryKey: ["queues", locale],
    queryFn: async () => {
      const loc = locale === "fr" ? "fr_fr" : "default"
      const res = await fetch(
        `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${loc}/v1/queues.json`
      )
      if (!res.ok) throw new Error("Queues unavailable")
      const list = (await res.json()) as { id: number; name: string }[]
      const map: Record<number, string> = {}
      for (const q of list) {
        if (q.id && q.name) map[q.id] = q.name
      }
      return map
    },
    staleTime: 24 * 3_600_000,
  })
}
