import { useQuery } from "@tanstack/react-query"

/** Map of puuid → currently in a game, for a set of players. */
export function useLiveStatus(region: string, puuids: string[]) {
  const key = [...puuids].sort().join(",")
  return useQuery({
    queryKey: ["live-status", region, key],
    queryFn: async () => {
      const res = await fetch(
        `/api/riot/live-status?region=${region}&puuids=${encodeURIComponent(key)}`
      )
      if (!res.ok) return {} as Record<string, boolean>
      const json = (await res.json()) as { status?: Record<string, boolean> }
      return json.status ?? {}
    },
    staleTime: 60_000,
    enabled: puuids.length > 0,
  })
}
