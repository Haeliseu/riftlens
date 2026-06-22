import type { Region } from "@riftlens/riot-api"
import { getMatchTimeline, RiotApiClient, regionToRouting } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { championSpellIcons, resolveAssets } from "@/lib/cdragon"

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const { searchParams } = req.nextUrl
  const region = (searchParams.get("region") ?? "EUW1") as Region
  const puuid = searchParams.get("puuid")
  const oppPuuid = searchParams.get("opp")
  const champId = parseInt(searchParams.get("champ") ?? "0", 10)
  const routing = regionToRouting(region)
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 })
  }

  try {
    const [tl, assets, spellIcons] = await Promise.all([
      getMatchTimeline(client, routing, matchId),
      resolveAssets(),
      champId > 0 ? championSpellIcons(champId) : Promise.resolve([null, null, null, null]),
    ])

    const idx = tl.metadata.participants.indexOf(puuid)
    if (idx < 0) {
      return NextResponse.json({ build: [], skills: [], at15: null, spellIcons })
    }
    const pid = idx + 1
    const oppPid = oppPuuid ? tl.metadata.participants.indexOf(oppPuuid) + 1 : 0

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

    // Laning phase @15 (frame index 15, or the last available frame).
    const frame15 = tl.info.frames[Math.min(15, tl.info.frames.length - 1)]
    const pf = frame15?.participantFrames
    const meF = pf?.[String(pid)]
    const oppF = oppPid > 0 ? pf?.[String(oppPid)] : undefined
    const meCs = (meF?.minionsKilled ?? 0) + (meF?.jungleMinionsKilled ?? 0)
    const oppCs = (oppF?.minionsKilled ?? 0) + (oppF?.jungleMinionsKilled ?? 0)
    const at15 = meF
      ? {
          cs: meCs,
          gold: meF.totalGold ?? 0,
          xp: meF.xp ?? 0,
          csDiff: oppF ? meCs - oppCs : null,
          goldDiff: oppF ? (meF.totalGold ?? 0) - (oppF.totalGold ?? 0) : null,
          xpDiff: oppF ? (meF.xp ?? 0) - (oppF.xp ?? 0) : null,
        }
      : null

    return NextResponse.json(
      { build, skills, at15, spellIcons },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
