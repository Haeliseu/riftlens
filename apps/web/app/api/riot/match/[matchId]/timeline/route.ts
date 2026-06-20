import type { Region } from "@riftlens/riot-api"
import { getMatchTimeline, RiotApiClient, regionToRouting } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { resolveAssets } from "@/lib/cdragon"

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const { searchParams } = req.nextUrl
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const puuid = searchParams.get("puuid")
  const routing = regionToRouting(region)
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  try {
    const [tl, assets] = await Promise.all([
      getMatchTimeline(client, routing, matchId),
      resolveAssets(),
    ])

    const idx = tl.metadata.participants.indexOf(puuid)
    if (idx < 0) {
      return NextResponse.json({ build: [], skills: [] })
    }
    const pid = idx + 1

    const build: { itemId: number; icon: string | null; minute: number }[] = []
    const skills: { slot: number; minute: number }[] = []

    for (const frame of tl.info.frames) {
      for (const e of frame.events) {
        if (e.participantId !== pid) continue
        if (e.type === "ITEM_PURCHASED" && e.itemId) {
          build.push({
            itemId: e.itemId,
            icon: assets.item(e.itemId),
            minute: Math.floor(e.timestamp / 60000),
          })
        } else if (e.type === "SKILL_LEVEL_UP" && e.skillSlot) {
          skills.push({ slot: e.skillSlot, minute: Math.floor(e.timestamp / 60000) })
        }
      }
    }

    return NextResponse.json(
      { build, skills },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
