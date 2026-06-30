import { getChampionIconUrl, getFeaturedGames } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam } from "@/lib/api-route"
import { resolveAssets } from "@/lib/cdragon"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const region = regionParam(req)
  const [data, assets] = await Promise.all([
    getFeaturedGames(riotClient(), region),
    resolveAssets(),
  ])

  const games = data.gameList.slice(0, 8).map((g) => ({
    gameId: g.gameId,
    queueId: g.gameQueueConfigId ?? null,
    gameMode: g.gameMode ?? null,
    gameLengthS: g.gameLength ?? 0,
    participants: g.participants.map((p) => ({
      teamId: p.teamId,
      championIcon: getChampionIconUrl(p.championId),
      spellIcons: [assets.spell(p.spell1Id), assets.spell(p.spell2Id)],
      name: p.riotId ?? p.summonerName ?? "",
    })),
  }))

  return { data: { region, games }, cache: CACHE.short }
})
