import { getAccountByRiotId, type RoutingRegion } from "@riftlens/riot-api"
import { CACHE, HttpError, jsonRoute } from "@/lib/api-route"
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
  const { searchParams } = req.nextUrl
  const gameName = searchParams.get("gameName")
  const tagLine = searchParams.get("tagLine")
  if (!gameName || !tagLine) throw new HttpError(400, "Missing gameName or tagLine")

  const routing = REGION_TO_ROUTING[searchParams.get("region") ?? "EUW1"] ?? "europe"
  const account = await getAccountByRiotId(riotClient(), routing, gameName, tagLine)
  return { data: account, cache: CACHE.long }
})
