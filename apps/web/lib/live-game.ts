import "server-only"
import type { PlayerTag, Region, RiotApiClient, RoutingRegion } from "@riftlens/riot-api"
import {
  computePlayerTags,
  getLeagueEntriesByPuuid,
  getLiveGame,
  getMatchIds,
  regionToRouting,
} from "@riftlens/riot-api"
import { withCache } from "@/lib/cache"
import { cachedRanks, cacheParticipantRank } from "@/lib/profile-db"
import { cachedMatch } from "@/lib/riot-cache"
import { riotClient } from "@/lib/riot-client"

const RECENT = 5
const FORM_TTL = 300 // 5 min — recent form is static during a live game

type RecentForm = Pick<
  LiveParticipant,
  "recentWins" | "recentLosses" | "streak" | "onFire" | "tags"
>

/** Recent ranked form (last few games) → W/L, streak, honoring tags. */
async function computeRecentForm(
  client: RiotApiClient,
  routing: RoutingRegion,
  puuid: string,
  championId: number
): Promise<RecentForm> {
  const ids = await getMatchIds(client, routing, puuid, { type: "ranked", count: RECENT })
  const fetched = await Promise.all(
    ids.map((id) => cachedMatch(client, routing, id).catch(() => null))
  )
  const recent: { win: boolean; championId: number; k: number; d: number; a: number }[] = []
  for (const m of fetched) {
    const me = m?.info.participants.find((x) => x.puuid === puuid)
    if (me)
      recent.push({
        win: me.win,
        championId: me.championId,
        k: me.kills,
        d: me.deaths,
        a: me.assists,
      })
  }
  const recentWins = recent.filter((r) => r.win).length
  const recentLosses = recent.length - recentWins
  // streak from most-recent (recent[0] is newest)
  let streak = 0
  for (const r of recent) {
    if (streak === 0) streak = r.win ? 1 : -1
    else if (r.win && streak > 0) streak++
    else if (!r.win && streak < 0) streak--
    else break
  }
  const onChamp = recent.filter((r) => r.championId === championId)
  const last = recent[0]
  const tags = computePlayerTags({
    session: {
      wins: recentWins,
      losses: recentLosses,
      winRate: recent.length ? Math.round((recentWins / recent.length) * 100) : 0,
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
  return { recentWins, recentLosses, streak, onFire: streak >= 3, tags }
}

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

/** A live participant before enrichment — just what spectator-v5 returns. */
function toBaseParticipant(p: {
  puuid?: string | undefined
  teamId: number
  championId: number
  riotId?: string | undefined
  summonerName?: string | undefined
}): LiveParticipant {
  return {
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
}

/**
 * Fast in-game detection: the raw spectator game with un-enriched participants
 * (champion, name, team — no ranks or recent form). Lets the page render the
 * loading-screen cards immediately, then fill in the details client-side.
 * Returns `null` when the player isn't in a game.
 */
export async function detectLiveGame(puuid: string, region: Region): Promise<LiveGameData | null> {
  const client = riotClient()
  let game: Awaited<ReturnType<typeof getLiveGame>>
  try {
    game = await getLiveGame(client, region, puuid)
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null
    throw err
  }
  return {
    gameMode: game.gameMode ?? null,
    queueId: game.gameQueueConfigId ?? null,
    gameLengthS: game.gameLength ?? 0,
    participants: game.participants.map(toBaseParticipant),
  }
}

/**
 * Builds the enriched live-game view: live spectator data joined with each
 * participant's rank (cached, else league-v4) and recent ranked form (W/L,
 * streak, honoring tags). Returns `null` when the player isn't in a game.
 * Shared by the `/api/riot/live-game` route and the `/live` page.
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
      const base = toBaseParticipant(p)
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

      // Recent ranked form — cached per player+champion: during a live game it
      // doesn't change, so this collapses ~6 Riot calls/player into one value
      // reused across the 30s client refetches and across viewers (the dev-key
      // 2-min budget is the bottleneck in prod).
      try {
        const form = await withCache(
          `live:form:${routing}:${p.puuid}:${p.championId}`,
          FORM_TTL,
          () => computeRecentForm(client, routing, p.puuid as string, p.championId)
        )
        base.recentWins = form.recentWins
        base.recentLosses = form.recentLosses
        base.streak = form.streak
        base.onFire = form.onFire
        base.tags = form.tags
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
