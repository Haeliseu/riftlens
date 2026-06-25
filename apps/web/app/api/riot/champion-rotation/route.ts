import { getChampionRotation } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam } from "@/lib/api-route"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const region = regionParam(req)
  const rotation = await getChampionRotation(riotClient(), region)
  return { data: rotation, cache: CACHE.long }
})
