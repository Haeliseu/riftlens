import type { Region } from "@riftlens/riot-api"
import {
  getLeagueEntriesByPuuid,
  getLiveGame,
  getMatchIds,
  RiotApiClient,
  regionToRouting,
} from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { cachedRanks, cacheParticipantRank } from "@/lib/profile-db"
import { cachedMatch } from "@/lib/riot-cache"

const RECENT = 5

interface LiveParticipant {
  puuid: string | null
  teamId: number
  championId: number
  name: string
  tier: string | null
  division: string | null
  lp: number | null
  recentWins: number
  recentLosses: number
  streak: number // >0 win streak, <0 loss streak
  onFire: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const puuid = searchParams.get("puuid")
  const region = (searchParams.get("region") ?? "EUW1") as Region
  if (!puuid) return NextResponse.json({ error: "Missing puuid" }, { status: 400 })

  const client = new RiotApiClient(process.env.RIOT_API_KEY!)
  const routing = regionToRouting(region)

  let game: Awaited<ReturnType<typeof getLiveGame>>
  try {
    game = await getLiveGame(client, region, puuid)
  } catch (err) {
    if ((err as { status?: number }).status === 404) return NextResponse.json(null)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const puuids = game.participants.map((p) => p.puuid).filter((x): x is string => !!x)
  const cache = await cachedRanks(puuids).catch(() => new Map())

  const participants = await Promise.all(
    game.participants.map(async (p): Promise<LiveParticipant> => {
      const base: LiveParticipant = {
        puuid: p.puuid ?? null,
        teamId: p.teamId,
        championId: p.championId,
        name: p.riotId ?? p.summonerName ?? "",
        tier: null,
        division: null,
        lp: null,
        recentWins: 0,
        recentLosses: 0,
        streak: 0,
        onFire: false,
      }
      if (!p.puuid) return base

      // Rank — from cache, else league-v4 + cache.
      const cached = cache.get(p.puuid)
      if (cached) {
        base.tier = cached.tier
        base.division = cached.division
        base.lp = cached.leaguePoints
      } else {
        const entries = await getLeagueEntriesByPuuid(client, region, p.puuid).catch(() => [])
        const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5")
        if (solo) {
          base.tier = solo.tier
          base.division = solo.rank
          base.lp = solo.leaguePoints
          await cacheParticipantRank(p.puuid, region, {
            tier: solo.tier,
            division: solo.rank,
            leaguePoints: solo.leaguePoints,
          }).catch(() => {})
        }
      }

      // Recent ranked form (last few games) → W/L + current streak.
      try {
        const ids = await getMatchIds(client, routing, p.puuid, { type: "ranked", count: RECENT })
        const results: boolean[] = []
        for (const id of ids) {
          // Cached so a live lookup over 10 players doesn't re-fetch the same
          // immutable matches and exhaust the dev rate limit.
          const m = await cachedMatch(client, routing, id).catch(() => null)
          const me = m?.info.participants.find((x) => x.puuid === p.puuid)
          if (me) results.push(me.win)
        }
        base.recentWins = results.filter(Boolean).length
        base.recentLosses = results.length - base.recentWins
        // streak from most-recent (results[0] is newest)
        let streak = 0
        for (const w of results) {
          if (streak === 0) streak = w ? 1 : -1
          else if (w && streak > 0) streak++
          else if (!w && streak < 0) streak--
          else break
        }
        base.streak = streak
        base.onFire = streak >= 3
      } catch {
        // best effort
      }
      return base
    })
  )

  return NextResponse.json(
    {
      gameMode: game.gameMode ?? null,
      queueId: game.gameQueueConfigId ?? null,
      gameLengthS: game.gameLength ?? 0,
      participants,
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  )
}
