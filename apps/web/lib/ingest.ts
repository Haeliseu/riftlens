import { db } from "@riftlens/db"
import {
  lpSnapshots,
  matches as matchesTable,
  matchParticipants,
  summonerMatches,
  summoners,
} from "@riftlens/db/schema"
import type { Division, MatchDto, Region, TierName } from "@riftlens/riot-api"
import { getMatch, getMatchIds, RiotApiClient, regionToRouting, tierToLP } from "@riftlens/riot-api"
import { and, desc, eq, inArray, sql } from "drizzle-orm"

function client() {
  return new RiotApiClient(process.env.RIOT_API_KEY ?? "")
}

function capTier(tier: string): TierName {
  return ((tier[0] ?? "") + tier.slice(1).toLowerCase()) as TierName
}

interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
}

/** Cache the player's current Solo rank + append an LP snapshot (deduped). */
export async function recordRankSnapshot(puuid: string, solo: SoloRank | null): Promise<void> {
  if (!solo) return
  const value = tierToLP(capTier(solo.tier), solo.rank as Division, solo.leaguePoints)

  await db
    .update(summoners)
    .set({
      soloTier: solo.tier,
      soloDivision: solo.rank,
      soloLeaguePoints: solo.leaguePoints,
      rankCheckedAt: sql`now()`,
    })
    .where(eq(summoners.puuid, puuid))

  const last = await db
    .select({ value: lpSnapshots.value })
    .from(lpSnapshots)
    .where(and(eq(lpSnapshots.puuid, puuid), eq(lpSnapshots.queueId, 420)))
    .orderBy(desc(lpSnapshots.recordedAt))
    .limit(1)

  if (last[0]?.value === value) return // unchanged since last view

  await db.insert(lpSnapshots).values({
    puuid,
    queueId: 420,
    tier: solo.tier,
    division: solo.rank,
    leaguePoints: solo.leaguePoints,
    value,
  })
}

async function storeMatch(region: string, m: MatchDto, targetPuuid: string): Promise<void> {
  const matchId = m.metadata.matchId
  const dur = m.info.gameDuration || 0

  const inserted = await db
    .insert(matchesTable)
    .values({
      matchId,
      region,
      gameMode: m.info.gameMode,
      gameType: m.info.gameType,
      gameDuration: m.info.gameDuration,
      gameCreation: m.info.gameCreation,
    })
    .onConflictDoNothing()
    .returning({ matchId: matchesTable.matchId })

  if (inserted.length > 0) {
    await db.insert(matchParticipants).values(
      m.info.participants.map((p) => ({
        matchId,
        puuid: p.puuid,
        gameName: p.riotIdGameName ?? null,
        tagLine: p.riotIdTagline ?? null,
        teamId: p.teamId,
        championName: p.championName,
        win: p.win,
        gameCreation: m.info.gameCreation,
      }))
    )
  }

  const p = m.info.participants.find((x) => x.puuid === targetPuuid)
  if (!p) return
  const teamKills = m.info.participants
    .filter((x) => x.teamId === p.teamId)
    .reduce((s, x) => s + x.kills, 0)

  await db
    .insert(summonerMatches)
    .values({
      puuid: targetPuuid,
      matchId,
      queueId: m.info.queueId ?? null,
      championId: p.championId,
      championName: p.championName,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      win: p.win,
      role: p.role ?? null,
      lane: p.lane ?? null,
      goldEarned: p.goldEarned ?? null,
      totalDamageDealt: p.totalDamageDealtToChampions ?? null,
      visionScore: p.visionScore ?? null,
      csPerMin:
        dur > 0 ? ((p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)) / (dur / 60) : 0,
      killParticipation: teamKills > 0 ? (p.kills + p.assists) / teamKills : 0,
      gameCreation: m.info.gameCreation,
      teamId: p.teamId,
    })
    .onConflictDoNothing()
}

/** Pull recent ranked matches not yet stored and persist them (bounded per call). */
export async function ingestRankedMatches(
  region: Region,
  puuid: string,
  maxNew = 20
): Promise<void> {
  const routing = regionToRouting(region)
  const c = client()
  // Pull a deep id list (1 cheap call); we persist up to `maxNew` new ones per
  // view so the season backfills progressively across visits.
  const ids = await getMatchIds(c, routing, puuid, { type: "ranked", count: 100 })
  if (ids.length === 0) return

  const existing = await db
    .select({ matchId: summonerMatches.matchId })
    .from(summonerMatches)
    .where(and(eq(summonerMatches.puuid, puuid), inArray(summonerMatches.matchId, ids)))
  const have = new Set(existing.map((e) => e.matchId))

  const toFetch = ids.filter((id) => !have.has(id)).slice(0, maxNew)
  for (const id of toFetch) {
    const m = await getMatch(c, routing, id).catch(() => null)
    if (m) await storeMatch(region, m, puuid)
  }
}

/** Best-effort: never throws (DB/migration/Riot issues must not break the page). */
export async function ingestProfile(
  region: Region,
  puuid: string,
  solo: SoloRank | null
): Promise<void> {
  await Promise.allSettled([recordRankSnapshot(puuid, solo), ingestRankedMatches(region, puuid)])
}
