import { getTopChampionMasteries } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { withCache } from "@/lib/cache"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const masteries = await withCache(`mastery:${region}:${puuid}`, 3600, () =>
    getTopChampionMasteries(riotClient(), region, puuid, 20)
  )
  return { data: masteries, cache: CACHE.long }
})
