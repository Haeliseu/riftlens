import { getSummonerByPuuid } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const summoner = await getSummonerByPuuid(riotClient(), region, puuid)
  return { data: summoner, cache: CACHE.long }
})
