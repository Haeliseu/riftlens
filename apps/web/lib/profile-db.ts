import { db } from "@riftlens/db"
import {
  lpSnapshots,
  matches,
  matchParticipants,
  summonerMatches,
  summoners,
} from "@riftlens/db/schema"
import { and, desc, eq, inArray } from "drizzle-orm"

// Detailed per-champion aggregate. Bucket holds SUMS; the UI divides by games.
export interface ChampDetailBucket {
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
  csPerMin: number
  kp: number // sum of killParticipation (0–1)
  gold: number
  damage: number
  vision: number
}

export interface ChampionDetail {
  championId: number
  championName: string
  total: ChampDetailBucket
  solo: ChampDetailBucket
  flex: ChampDetailBucket
  aram: ChampDetailBucket
  arena: ChampDetailBucket
}

function emptyDetail(): ChampDetailBucket {
  return {
    games: 0,
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    csPerMin: 0,
    kp: 0,
    gold: 0,
    damage: 0,
    vision: 0,
  }
}

function addDetail(
  b: ChampDetailBucket,
  r: {
    win: boolean
    k: number
    d: number
    a: number
    csPerMin: number
    kp: number
    gold: number
    damage: number
    vision: number
  }
) {
  b.games += 1
  b.wins += r.win ? 1 : 0
  b.kills += r.k
  b.deaths += r.d
  b.assists += r.a
  b.csPerMin += r.csPerMin
  b.kp += r.kp
  b.gold += r.gold
  b.damage += r.damage
  b.vision += r.vision
}

/** Detailed per-champion aggregate over ALL stored ranked games. */
export async function championStatsFromDb(puuid: string): Promise<ChampionDetail[]> {
  const rows = await db
    .select({
      championId: summonerMatches.championId,
      championName: summonerMatches.championName,
      queueId: summonerMatches.queueId,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
      csPerMin: summonerMatches.csPerMin,
      kp: summonerMatches.killParticipation,
      gold: summonerMatches.goldEarned,
      damage: summonerMatches.totalDamageDealt,
      vision: summonerMatches.visionScore,
    })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const byChamp = new Map<number, ChampionDetail>()
  for (const r of rows) {
    if (r.championId == null) continue
    const agg =
      byChamp.get(r.championId) ??
      ({
        championId: r.championId,
        championName: r.championName ?? "",
        total: emptyDetail(),
        solo: emptyDetail(),
        flex: emptyDetail(),
        aram: emptyDetail(),
        arena: emptyDetail(),
      } satisfies ChampionDetail)
    const line = {
      win: r.win ?? false,
      k: r.kills ?? 0,
      d: r.deaths ?? 0,
      a: r.assists ?? 0,
      csPerMin: r.csPerMin ?? 0,
      kp: r.kp ?? 0,
      gold: r.gold ?? 0,
      damage: r.damage ?? 0,
      vision: r.vision ?? 0,
    }
    addDetail(agg.total, line)
    if (r.queueId === 420) addDetail(agg.solo, line)
    else if (r.queueId === 440) addDetail(agg.flex, line)
    else if (r.queueId === 450) addDetail(agg.aram, line)
    else if (r.queueId === 1700 || r.queueId === 1710) addDetail(agg.arena, line)
    byChamp.set(r.championId, agg)
  }
  return [...byChamp.values()].sort((a, b) => b.total.games - a.total.games)
}

export interface LpPoint {
  value: number
  tier: string
  division: string
  leaguePoints: number
  recordedAt: string
}

/** Solo/Duo LP snapshots over time (chronological) for the LP chart. */
export async function lpHistoryFromDb(puuid: string, queueId = 420): Promise<LpPoint[]> {
  const rows = await db
    .select({
      value: lpSnapshots.value,
      tier: lpSnapshots.tier,
      division: lpSnapshots.division,
      leaguePoints: lpSnapshots.leaguePoints,
      recordedAt: lpSnapshots.recordedAt,
    })
    .from(lpSnapshots)
    .where(and(eq(lpSnapshots.puuid, puuid), eq(lpSnapshots.queueId, queueId)))
    .orderBy(lpSnapshots.recordedAt)

  return rows.map((r) => ({
    value: r.value,
    tier: r.tier,
    division: r.division,
    leaguePoints: r.leaguePoints,
    recordedAt: (r.recordedAt as Date).toISOString(),
  }))
}

export interface CachedRank {
  tier: string
  division: string
  leaguePoints: number
}

/** Distinct participant puuids from the player's most recent stored matches. */
export async function recentParticipantPuuids(
  puuid: string,
  games = 20
): Promise<{ puuids: string[]; games: number }> {
  const recent = await db
    .select({ matchId: summonerMatches.matchId })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))
    .orderBy(desc(summonerMatches.gameCreation))
    .limit(games)
  const ids = recent.map((r) => r.matchId).filter((x): x is string => x != null)
  if (ids.length === 0) return { puuids: [], games: 0 }

  const parts = await db
    .select({ puuid: matchParticipants.puuid })
    .from(matchParticipants)
    .where(inArray(matchParticipants.matchId, ids))
  return { puuids: [...new Set(parts.map((p) => p.puuid))], games: ids.length }
}

/** Read cached Solo ranks for a set of puuids (only those checked recently). */
export async function cachedRanks(
  puuids: string[],
  maxAgeMs = 7 * 24 * 3_600_000
): Promise<Map<string, CachedRank>> {
  if (puuids.length === 0) return new Map()
  const rows = await db
    .select({
      puuid: summoners.puuid,
      tier: summoners.soloTier,
      division: summoners.soloDivision,
      lp: summoners.soloLeaguePoints,
      checkedAt: summoners.rankCheckedAt,
    })
    .from(summoners)
    .where(inArray(summoners.puuid, puuids))

  const out = new Map<string, CachedRank>()
  const cutoff = Date.now() - maxAgeMs
  for (const r of rows) {
    if (!r.tier || !r.division || r.lp == null) continue
    if (r.checkedAt && (r.checkedAt as Date).getTime() < cutoff) continue
    out.set(r.puuid, { tier: r.tier, division: r.division, leaguePoints: r.lp })
  }
  return out
}

export interface LpPerGame {
  /** matchId -> LP change, only for unambiguously attributable games */
  matchLp: Record<string, number>
  /** championId -> net LP across attributable games */
  byChampion: Record<number, number>
}

/**
 * Best-effort LP per game: Riot doesn't expose it, so we attribute the LP delta
 * between two consecutive snapshots to the single ranked game that sits between
 * them (when exactly one does). Ambiguous intervals are skipped.
 */
export async function lpPerGameFromDb(puuid: string): Promise<LpPerGame> {
  const snaps = await db
    .select({ value: lpSnapshots.value, recordedAt: lpSnapshots.recordedAt })
    .from(lpSnapshots)
    .where(and(eq(lpSnapshots.puuid, puuid), eq(lpSnapshots.queueId, 420)))
    .orderBy(lpSnapshots.recordedAt)

  const games = await db
    .select({
      matchId: summonerMatches.matchId,
      gameCreation: summonerMatches.gameCreation,
      championId: summonerMatches.championId,
    })
    .from(summonerMatches)
    .where(and(eq(summonerMatches.puuid, puuid), eq(summonerMatches.queueId, 420)))

  const matchLp: Record<string, number> = {}
  for (let i = 1; i < snaps.length; i++) {
    const a = snaps[i - 1]
    const b = snaps[i]
    if (!a || !b) continue
    const at = (a.recordedAt as Date).getTime()
    const bt = (b.recordedAt as Date).getTime()
    const between = games.filter(
      (g) => g.gameCreation != null && g.gameCreation > at && g.gameCreation <= bt
    )
    if (between.length === 1 && between[0]?.matchId) {
      matchLp[between[0].matchId] = b.value - a.value
    }
  }

  const byChampion: Record<number, number> = {}
  for (const g of games) {
    if (g.matchId && g.championId != null && matchLp[g.matchId] !== undefined) {
      byChampion[g.championId] = (byChampion[g.championId] ?? 0) + (matchLp[g.matchId] ?? 0)
    }
  }
  return { matchLp, byChampion }
}

export interface PingStat {
  key: string
  count: number
}

/** Total ping counts (by Riot ping key) across stored matches. */
export async function pingStatsFromDb(
  puuid: string
): Promise<{ total: number; byKey: PingStat[] }> {
  const rows = await db
    .select({ pings: summonerMatches.pings })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const totals = new Map<string, number>()
  for (const r of rows) {
    const p = r.pings as Record<string, number> | null
    if (!p) continue
    for (const [k, v] of Object.entries(p)) totals.set(k, (totals.get(k) ?? 0) + (v ?? 0))
  }
  const byKey = [...totals.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
  return { total: byKey.reduce((s, x) => s + x.count, 0), byKey }
}

export interface CoachInput {
  role: string
  games: number
  csPerMin: number
  kp: number // 0..1
  deathsPerGame: number
  kda: number
  visionPerMin: number
  goldPerMin: number
  dpm: number // damage to champions per minute
  winRate: number // 0..100
}

/** Aggregate the player's main role from stored ranked games for the coaching
 * engine. Joins matches for game duration → per-minute gold/vision. */
export async function coachingFromDb(puuid: string): Promise<CoachInput | null> {
  const rows = await db
    .select({
      role: summonerMatches.role,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
      visionScore: summonerMatches.visionScore,
      goldEarned: summonerMatches.goldEarned,
      damage: summonerMatches.totalDamageDealt,
      csPerMin: summonerMatches.csPerMin,
      kp: summonerMatches.killParticipation,
      duration: matches.gameDuration,
    })
    .from(summonerMatches)
    .innerJoin(matches, eq(summonerMatches.matchId, matches.matchId))
    .where(and(eq(summonerMatches.puuid, puuid), inArray(summonerMatches.queueId, [420, 440])))

  if (rows.length === 0) return null

  type Agg = {
    games: number
    wins: number
    kills: number
    deaths: number
    assists: number
    visionPerMin: number
    goldPerMin: number
    dpm: number
    csPerMin: number
    kp: number
  }
  const byRole = new Map<string, Agg>()
  for (const r of rows) {
    const role = r.role || "UNKNOWN"
    const a = byRole.get(role) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      visionPerMin: 0,
      goldPerMin: 0,
      dpm: 0,
      csPerMin: 0,
      kp: 0,
    }
    const mins = (r.duration ?? 0) / 60
    a.games += 1
    a.wins += r.win ? 1 : 0
    a.kills += r.kills ?? 0
    a.deaths += r.deaths ?? 0
    a.assists += r.assists ?? 0
    a.visionPerMin += mins > 0 ? (r.visionScore ?? 0) / mins : 0
    a.goldPerMin += mins > 0 ? (r.goldEarned ?? 0) / mins : 0
    a.dpm += mins > 0 ? (r.damage ?? 0) / mins : 0
    a.csPerMin += r.csPerMin ?? 0
    a.kp += r.kp ?? 0
    byRole.set(role, a)
  }

  // Main role = most games (ignore UNKNOWN unless it's the only one).
  const ranked = [...byRole.entries()]
    .filter(([role]) => role !== "UNKNOWN")
    .sort((a, b) => b[1].games - a[1].games)
  const [role, a] = ranked[0] ?? [...byRole.entries()][0]!
  if (!a) return null

  const kda = a.deaths === 0 ? a.kills + a.assists : (a.kills + a.assists) / a.deaths
  return {
    role,
    games: a.games,
    csPerMin: a.csPerMin / a.games,
    kp: a.kp / a.games,
    deathsPerGame: a.deaths / a.games,
    kda,
    visionPerMin: a.visionPerMin / a.games,
    goldPerMin: a.goldPerMin / a.games,
    dpm: a.dpm / a.games,
    winRate: Math.round((a.wins / a.games) * 100),
  }
}

export interface SeasonChamp {
  championId: number
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
}
export interface PlayerSeason {
  mainRole: string | null
  topChampions: SeasonChamp[]
}

/** Main role (majority of stored ranked games) + top season champions, for the
 * leaderboard. Reads only what's already in our DB. */
export async function playerSeasonFromDb(puuid: string): Promise<PlayerSeason> {
  const rows = await db
    .select({
      role: summonerMatches.role,
      championId: summonerMatches.championId,
      kills: summonerMatches.kills,
      deaths: summonerMatches.deaths,
      assists: summonerMatches.assists,
      win: summonerMatches.win,
    })
    .from(summonerMatches)
    .where(and(eq(summonerMatches.puuid, puuid), inArray(summonerMatches.queueId, [420, 440])))

  if (rows.length === 0) return { mainRole: null, topChampions: [] }

  const roleGames = new Map<string, number>()
  const byChamp = new Map<number, SeasonChamp>()
  for (const r of rows) {
    const role = r.role || "UNKNOWN"
    if (role !== "UNKNOWN") roleGames.set(role, (roleGames.get(role) ?? 0) + 1)
    if (r.championId == null) continue
    const c = byChamp.get(r.championId) ?? {
      championId: r.championId,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    }
    c.games += 1
    c.wins += r.win ? 1 : 0
    c.kills += r.kills ?? 0
    c.deaths += r.deaths ?? 0
    c.assists += r.assists ?? 0
    byChamp.set(r.championId, c)
  }

  const mainRole = [...roleGames.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const topChampions = [...byChamp.values()].sort((a, b) => b.games - a.games).slice(0, 3)
  return { mainRole, topChampions }
}

export interface RolePerf {
  role: string
  games: number
  wins: number
}

/** Win/games per role from stored ranked games (role = stored teamPosition). */
export async function rolePerformanceFromDb(puuid: string): Promise<RolePerf[]> {
  const rows = await db
    .select({ role: summonerMatches.role, win: summonerMatches.win })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))

  const byRole = new Map<string, RolePerf>()
  for (const r of rows) {
    const role = r.role || "UNKNOWN"
    const agg = byRole.get(role) ?? { role, games: 0, wins: 0 }
    agg.games += 1
    agg.wins += r.win ? 1 : 0
    byRole.set(role, agg)
  }
  return [...byRole.values()].sort((a, b) => b.games - a.games)
}

export interface CrossedPlayer {
  puuid: string
  gameName: string | null
  tagLine: string | null
  profileIconId: number | null
  encounters: number
  wins: number
  asAlly: number
  asEnemy: number
}

/** Players met in 2+ of the owner's stored games, with the owner's WR alongside them. */
export async function crossedPlayersFromDb(puuid: string, limit = 5): Promise<CrossedPlayer[]> {
  const own = await db
    .select({
      matchId: summonerMatches.matchId,
      win: summonerMatches.win,
      teamId: summonerMatches.teamId,
    })
    .from(summonerMatches)
    .where(eq(summonerMatches.puuid, puuid))
  const ids = own.map((o) => o.matchId).filter((x): x is string => x != null)
  if (ids.length === 0) return []

  const ownByMatch = new Map(own.filter((o) => o.matchId).map((o) => [o.matchId, o]))

  const parts = await db
    .select({
      matchId: matchParticipants.matchId,
      puuid: matchParticipants.puuid,
      gameName: matchParticipants.gameName,
      tagLine: matchParticipants.tagLine,
      profileIconId: matchParticipants.profileIconId,
      teamId: matchParticipants.teamId,
    })
    .from(matchParticipants)
    .where(inArray(matchParticipants.matchId, ids))

  const map = new Map<string, CrossedPlayer>()
  for (const p of parts) {
    if (p.puuid === puuid) continue
    const own = p.matchId ? ownByMatch.get(p.matchId) : undefined
    if (!own) continue
    const c = map.get(p.puuid) ?? {
      puuid: p.puuid,
      gameName: p.gameName,
      tagLine: p.tagLine,
      profileIconId: p.profileIconId,
      encounters: 0,
      wins: 0,
      asAlly: 0,
      asEnemy: 0,
    }
    c.encounters += 1
    c.wins += own.win ? 1 : 0
    if (own.teamId != null && p.teamId === own.teamId) c.asAlly += 1
    else c.asEnemy += 1
    if (!c.gameName && p.gameName) c.gameName = p.gameName
    if (!c.tagLine && p.tagLine) c.tagLine = p.tagLine
    if (c.profileIconId == null && p.profileIconId != null) c.profileIconId = p.profileIconId
    map.set(p.puuid, c)
  }

  return [...map.values()]
    .filter((c) => c.encounters >= 2)
    .sort((a, b) => b.encounters - a.encounters)
    .slice(0, limit)
}

/** Upsert a participant's Solo rank into the summoners cache. */
export async function cacheParticipantRank(
  puuid: string,
  region: string,
  rank: CachedRank
): Promise<void> {
  await db
    .insert(summoners)
    .values({
      puuid,
      region,
      gameName: "",
      tagLine: "",
      soloTier: rank.tier,
      soloDivision: rank.division,
      soloLeaguePoints: rank.leaguePoints,
      rankCheckedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: summoners.puuid,
      set: {
        soloTier: rank.tier,
        soloDivision: rank.division,
        soloLeaguePoints: rank.leaguePoints,
        rankCheckedAt: new Date(),
      },
    })
}
