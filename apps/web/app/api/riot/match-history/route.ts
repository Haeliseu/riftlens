import { getMatchHistory } from "@riftlens/riot-api"
import { CACHE, jsonRoute, regionParam, requireParam } from "@/lib/api-route"
import { withCache } from "@/lib/cache"
import { resolveAssets } from "@/lib/cdragon"
import { riotClient } from "@/lib/riot-client"

export const GET = jsonRoute(async (req) => {
  const { searchParams } = req.nextUrl
  const puuid = requireParam(req, "puuid")
  const region = regionParam(req)
  const count = Math.min(100, Math.max(1, parseInt(searchParams.get("count") ?? "10", 10)))
  const start = Math.max(0, parseInt(searchParams.get("start") ?? "0", 10))
  const queueParam = searchParams.get("queue")
  const queue = queueParam ? parseInt(queueParam, 10) : undefined

  const client = riotClient()

  // Cache the enriched page briefly so repeat navigations don't re-fetch the
  // same matches from Riot each time (eases the dev-key rate limit).
  const enriched = await withCache(
    `mh:${region}:${puuid}:${queue ?? "all"}:${start}:${count}`,
    180,
    async () => {
      const [matches, assets] = await Promise.all([
        getMatchHistory(client, region, puuid, count, queue, start),
        resolveAssets(),
      ])
      // Attach resolved CDN icon URLs for the player's summoner spells + runes so
      // the history row can render them inline (à la DPM) without a per-row fetch.
      return matches.map((m) => ({
        ...m,
        itemIcons: m.items.map((id) => assets.item(id)),
        spellIcons: m.summonerSpellIds.map((id) => assets.spell(id)),
        keystoneIcon: assets.perk(m.keystoneId ?? undefined),
        secondaryIcon: assets.perk(m.secondaryPerkId ?? undefined),
      }))
    }
  )
  return { data: enriched, cache: CACHE.medium }
})
