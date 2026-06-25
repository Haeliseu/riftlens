import { getPlayerChallenges } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { withCache } from "@/lib/cache"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const data = await withCache(`chal:${region}:${puuid}`, 3600, () =>
    getPlayerChallenges(riotClient(), region, puuid)
  )
  return { data, cache: CACHE.long }
})
