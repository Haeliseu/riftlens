import type { Participant, Region } from "@riftlens/riot-api"
import { getMatch, RiotApiClient, regionToRouting } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { resolveAssets } from "@/lib/cdragon"

const PING_FIELDS: { key: keyof Participant; label: string }[] = [
  { key: "onMyWayPings", label: "En route" },
  { key: "assistMePings", label: "Aidez-moi" },
  { key: "enemyMissingPings", label: "Ennemi absent" },
  { key: "dangerPings", label: "Danger" },
  { key: "getBackPings", label: "Repli" },
  { key: "pushPings", label: "Pousser" },
  { key: "needVisionPings", label: "Vision" },
  { key: "enemyVisionPings", label: "Vision ennemie" },
  { key: "holdPings", label: "Tenir" },
  { key: "allInPings", label: "All-in" },
  { key: "commandPings", label: "Commande" },
  { key: "visionClearedPings", label: "Vision nettoyée" },
  { key: "basicPings", label: "Basique" },
]

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  const routing = regionToRouting(region)
  const client = new RiotApiClient(process.env.RIOT_API_KEY!)

  try {
    const m = await getMatch(client, routing, matchId)
    const assets = await resolveAssets()
    const dur = m.info.gameDuration || 0

    const participants = m.info.participants.map((p) => {
      const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)
      const styles = p.perks?.styles ?? []
      const primary = styles[0]?.selections.map((s) => assets.perk(s.perk)) ?? []
      const secondary = styles[1]?.selections.map((s) => assets.perk(s.perk)) ?? []
      const shards = p.perks?.statPerks
        ? [
            assets.perk(p.perks.statPerks.offense),
            assets.perk(p.perks.statPerks.flex),
            assets.perk(p.perks.statPerks.defense),
          ]
        : []

      const pings = PING_FIELDS.map((f) => ({
        label: f.label,
        count: (p[f.key] as number | undefined) ?? 0,
      })).filter((x) => x.count > 0)
      const totalPings = pings.reduce((s, x) => s + x.count, 0)

      return {
        puuid: p.puuid,
        gameName: p.riotIdGameName ?? p.summonerName ?? "",
        tagLine: p.riotIdTagline ?? "",
        teamId: p.teamId,
        championId: p.championId,
        championName: p.championName,
        champLevel: p.champLevel ?? 0,
        win: p.win,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        cs,
        csPerMin: dur > 0 ? +(cs / (dur / 60)).toFixed(1) : 0,
        goldEarned: p.goldEarned ?? 0,
        damage: p.totalDamageDealtToChampions ?? 0,
        visionScore: p.visionScore ?? 0,
        position: p.teamPosition ?? p.individualPosition ?? "",
        items: [
          assets.item(p.item0),
          assets.item(p.item1),
          assets.item(p.item2),
          assets.item(p.item3),
          assets.item(p.item4),
          assets.item(p.item5),
        ],
        trinket: assets.item(p.item6),
        spells: [assets.spell(p.summoner1Id), assets.spell(p.summoner2Id)],
        runes: { keystone: primary[0] ?? null, primary, secondary, shards },
        pings,
        totalPings,
      }
    })

    return NextResponse.json(
      { matchId, region, queueId: m.info.queueId ?? null, gameDurationS: dur, participants },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    )
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
