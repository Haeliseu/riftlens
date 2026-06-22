import type { Region } from "@riftlens/riot-api"
import { getMatchHistory, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { resolveAssets } from "@/lib/cdragon"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const count = Math.min(50, Math.max(1, parseInt(searchParams.get("count") ?? "10", 10)))

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    // Cache the enriched list briefly so repeat navigations don't re-fetch ~20
    // matches from Riot each time (eases the dev-key rate limit).
    const enriched = await withCache(`mh:${region}:${puuid}:${count}`, 180, async () => {
      const [matches, assets] = await Promise.all([
        getMatchHistory(client, region, puuid, count),
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
    })
    return NextResponse.json(enriched, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
