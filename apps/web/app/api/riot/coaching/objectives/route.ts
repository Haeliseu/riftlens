import type { Region } from "@riftlens/riot-api"
import { getMatchIds, getMatchTimeline, RiotApiClient, regionToRouting } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { cacheGet, cacheSet, withCache } from "@/lib/cache"
import {
  analyzeMatchObjectives,
  type MatchObjectiveResult,
  type ObjectiveSummary,
  summarizeObjectives,
} from "@/lib/objectives"

const GAMES = 6

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid")
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })

  // The summary depends on recent games — cache it briefly; timelines (immutable)
  // are cached long and shared with other timeline reads.
  const cacheKey = `obj:${region}:${puuid}`
  const cached = await cacheGet<ObjectiveSummary | null>(cacheKey)
  if (cached !== null)
    return NextResponse.json(cached, { headers: { "Cache-Control": "no-store" } })

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)
  const routing = regionToRouting(region)

  try {
    const ids = await getMatchIds(client, routing, puuid, { type: "ranked", count: GAMES })
    const results: MatchObjectiveResult[] = []
    for (const id of ids) {
      const tl = await withCache(`tl:${routing}:${id}`, 2_592_000, () =>
        getMatchTimeline(client, routing, id)
      ).catch(() => null)
      if (!tl) continue
      const r = analyzeMatchObjectives(tl, puuid)
      if (r) results.push(r)
    }
    const summary = summarizeObjectives(results)
    await cacheSet(cacheKey, summary, 1800)
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } })
  }
}
