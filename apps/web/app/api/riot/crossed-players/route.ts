import type { Region } from "@riftlens/riot-api"
import { getSummonerByPuuid, RiotApiClient } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { crossedPlayersFromDb } from "@/lib/profile-db"

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  try {
    const players = await crossedPlayersFromDb(puuid)
    // Backfill avatars not yet stored (old participant rows have no profile
    // icon): fetch the live profile icon for the handful of players.
    const client = new RiotApiClient(process.env.RIOT_API_KEY!)
    const enriched = await Promise.all(
      players.map(async (p) => {
        if (p.profileIconId != null) return p
        const s = await withCache(`sum:${region}:${p.puuid}`, 86400, () =>
          getSummonerByPuuid(client, region, p.puuid)
        ).catch(() => null)
        return s ? { ...p, profileIconId: s.profileIconId } : p
      })
    )
    return NextResponse.json(enriched, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    })
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } })
  }
}
