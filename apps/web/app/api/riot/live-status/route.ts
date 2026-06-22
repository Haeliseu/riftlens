import { getLiveGame, type Region } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { cacheGet, cacheSet } from "@/lib/cache"
import { riotClient } from "@/lib/riot-client"

// Lightweight "is this player in a game?" check for the leaderboard. One
// spectator-v5 call per puuid (404 = not in game), cached 60s so a page of
// rows doesn't re-hit the API on every render.
const MAX = 50
const TTL = 60

export async function GET(req: NextRequest) {
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  const puuids = (req.nextUrl.searchParams.get("puuids") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, MAX)
  if (puuids.length === 0) return NextResponse.json({ status: {} })

  const client = riotClient()
  const entries = await Promise.all(
    puuids.map(async (puuid) => {
      const key = `live:${region}:${puuid}`
      const cached = await cacheGet<boolean>(key)
      if (cached !== null) return [puuid, cached] as const
      let inGame = false
      try {
        await getLiveGame(client, region, puuid)
        inGame = true
      } catch {
        // 404 = not in game; any other error is treated as "not live" (best effort)
      }
      await cacheSet(key, inGame, TTL)
      return [puuid, inGame] as const
    })
  )

  return NextResponse.json(
    { status: Object.fromEntries(entries) },
    { headers: { "Cache-Control": "no-store" } }
  )
}
