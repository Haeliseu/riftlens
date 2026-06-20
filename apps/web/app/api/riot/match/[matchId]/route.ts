import type { Region } from "@riftlens/riot-api"
import { getMatch, RiotApiClient, regionToRouting } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  const routing = regionToRouting(region)
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const m = await getMatch(client, routing, matchId)
    const dur = m.info.gameDuration || 0
    const participants = m.info.participants.map((p) => ({
      puuid: p.puuid,
      gameName: p.riotIdGameName ?? p.summonerName ?? "",
      tagLine: p.riotIdTagline ?? "",
      teamId: p.teamId,
      championId: p.championId,
      championName: p.championName,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
      goldEarned: p.goldEarned ?? 0,
      visionScore: p.visionScore ?? 0,
      position: p.teamPosition ?? p.individualPosition ?? "",
    }))
    return NextResponse.json(
      { matchId, region, queueId: m.info.queueId ?? null, gameDurationS: dur, participants },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
