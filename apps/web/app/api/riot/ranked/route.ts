import { getLeagueEntriesBySummonerId } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const summonerId = requireParam(req, "summonerId")
  const region = regionParam(req)
  const entries = await getLeagueEntriesBySummonerId(riotClient(), region, summonerId)
  return { data: entries, cache: CACHE.medium }
})
