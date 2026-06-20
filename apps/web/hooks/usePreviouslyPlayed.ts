import type { PreviouslyPlayedInfo } from "@riftlens/riot-api"
import { useQuery } from "@tanstack/react-query"

export function usePreviouslyPlayed(myPuuid: string | null, theirPuuid: string) {
  return useQuery({
    queryKey: ["previously-played", myPuuid, theirPuuid],
    queryFn: async () => {
      const res = await fetch(`/api/riot/previously-played?my=${myPuuid}&their=${theirPuuid}`)
      if (!res.ok) return null
      return res.json() as Promise<PreviouslyPlayedInfo | null>
    },
    staleTime: 300_000,
    enabled: !!myPuuid && !!theirPuuid,
  })
}
