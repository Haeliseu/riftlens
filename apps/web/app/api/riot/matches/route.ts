import type { RoutingRegion } from "@riftlens/riot-api"
import { getMatchIds, SEASON_2_2026_START_MS } from "@riftlens/riot-api"
import { CACHE, jsonRoute, requireParam } from "@/lib/api-route"
import { riotClient } from "@/lib/riot-client"

const REGION_TO_ROUTING: Record<string, RoutingRegion> = {
  EUW1: "europe",
  EUN1: "europe",
  TR1: "europe",
  RU: "europe",
  NA1: "americas",
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  KR: "asia",
  JP1: "asia",
  OC1: "sea",
}

export const GET = jsonRoute(async (req) => {
  const puuid = requireParam(req, "puuid")
  const region = req.nextUrl.searchParams.get("region") ?? "EUW1"
  const count = parseInt(req.nextUrl.searchParams.get("count") ?? "20", 10)
  const routing = REGION_TO_ROUTING[region] ?? "europe"

  const matchIds = await getMatchIds(riotClient(), routing, puuid, {
    queue: 420, // RANKED_SOLO_5x5
    startTime: SEASON_2_2026_START_MS,
    count,
  })
  return { data: matchIds, cache: CACHE.medium }
})
