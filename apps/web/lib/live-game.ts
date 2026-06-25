import "server-only"
import type { PlayerTag, Region } from "@riftlens/riot-api"
import {
  computePlayerTags,
  getLeagueEntriesByPuuid,
  getLiveGame,
  getMatchIds,
  regionToRouting,
} from "@riftlens/riot-api"
import { cachedRanks, cacheParticipantRank } from "@/lib/profile-db"
import { cachedMatch } from "@/lib/riot-cache"
import { riotClient } from "@/lib/riot-client"

const RECENT = 5

export interface LiveParticipant {
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
  tags: PlayerTag[]
}

export interface LiveGameData {
  gameMode: string | null
  queueId: number | null
  gameLengthS: number
  participants: LiveParticipant[]
}

/**
 * Builds the enriched live-game view for a player: live spectator data joined
 * with each participant's rank (cached, else league-v4) and recent ranked form
 * (W/L, streak, honoring tags). Returns `null` when the player isn't in a game.
 *
 * Shared by the `/api/riot/live-game` route and the `/live` page so both render
 * identical data — the page can run it server-side for a ready-on-load paint.
 */
export async function buildLiveGame(puuid: string, region: Region): Promise<LiveGameData | null> {
  const client = riotClient()
  const routing = regionToRouting(region)

  let game: Awaited<ReturnType<typeof getLiveGame>>
  try {
    game = await getLiveGame(client, region, puuid)
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null
    throw err
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
        tags: [],
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

      // Recent ranked form (last few games, newest first) → W/L, streak, tags.
      try {
        const ids = await getMatchIds(client, routing, p.puuid, { type: "ranked", count: RECENT })
        // Fetch the recent matches in parallel (cached + globally throttled by
        // the Riot client) — keeps the live lookup snappy without re-fetching.
        const fetched = await Promise.all(
          ids.map((id) => cachedMatch(client, routing, id).catch(() => null))
        )
        const recent: { win: boolean; championId: number; k: number; d: number; a: number }[] = []
        for (const m of fetched) {
          const me = m?.info.participants.find((x) => x.puuid === p.puuid)
          if (me)
            recent.push({
              win: me.win,
              championId: me.championId,
              k: me.kills,
              d: me.deaths,
              a: me.assists,
            })
        }
        base.recentWins = recent.filter((r) => r.win).length
        base.recentLosses = recent.length - base.recentWins
        // streak from most-recent (recent[0] is newest)
        let streak = 0
        for (const r of recent) {
          if (streak === 0) streak = r.win ? 1 : -1
          else if (r.win && streak > 0) streak++
          else if (!r.win && streak < 0) streak--
          else break
        }
        base.streak = streak
        base.onFire = streak >= 3

        // Honoring/informational tags (no shaming — Riot dev policy).
        const onChamp = recent.filter((r) => r.championId === p.championId)
        const last = recent[0]
        base.tags = computePlayerTags({
          session: {
            wins: base.recentWins,
            losses: base.recentLosses,
            winRate: recent.length ? Math.round((base.recentWins / recent.length) * 100) : 0,
            gamesPlayed: recent.length,
            streak,
          },
          champWinRate: onChamp.length
            ? Math.round((onChamp.filter((r) => r.win).length / onChamp.length) * 100)
            : 0,
          champGames: onChamp.length,
          recentChampGames: onChamp.length,
          lastGameKDA: last ? [last.k, last.d, last.a] : [0, 0, 0],
        })
      } catch {
        // best effort
      }
      return base
    })
  )

  return {
    gameMode: game.gameMode ?? null,
    queueId: game.gameQueueConfigId ?? null,
    gameLengthS: game.gameLength ?? 0,
    participants,
  }
}
