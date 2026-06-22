import type { Region, RiotApiClient } from "../client"
import { regionToRouting } from "../client"
import type { Division, RankedEntry, TierName } from "../utils/rank"
import { computeAverageGameRank } from "../utils/rank"
import { getAccountByRiotId, getActiveRegion } from "./account"
import { getLeagueEntriesByPuuid } from "./league"
import { getMatch, getMatchIds } from "./match"
import { getSummonerByPuuid } from "./summoner"

function capitalizeTier(tier: string): TierName {
  return ((tier[0] ?? "") + tier.slice(1).toLowerCase()) as TierName
}

export interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

export interface ProfileSummary {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  summonerLevel: number
  soloRank: SoloRank | null
  flexRank: SoloRank | null
  /** platform region where the player is actually active (e.g. "EUW1"), if known */
  activeRegion: string | null
}

/**
 * Full search-result enrichment, matching what opgg/dpm show:
 * Riot ID → puuid → profile (icon, level) → ranked (Solo/Duo tier, LP, W/L).
 */
export async function getProfileSummary(
  client: RiotApiClient,
  region: Region,
  gameName: string,
  tagLine: string
): Promise<ProfileSummary> {
  const routing = regionToRouting(region)
  const account = await getAccountByRiotId(client, routing, gameName, tagLine)

  const [summoner, entries, activeRegion] = await Promise.all([
    getSummonerByPuuid(client, region, account.puuid),
    getLeagueEntriesByPuuid(client, region, account.puuid).catch(() => []),
    getActiveRegion(client, routing, account.puuid).catch(() => null),
  ])

  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5")
  const flex = entries.find((e) => e.queueType === "RANKED_FLEX_SR")
  const toRank = (e: typeof solo): SoloRank | null =>
    e
      ? {
          tier: e.tier,
          rank: e.rank,
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
        }
      : null

  return {
    puuid: account.puuid,
    gameName: account.gameName ?? gameName,
    tagLine: account.tagLine ?? tagLine,
    profileIconId: summoner.profileIconId,
    summonerLevel: summoner.summonerLevel,
    soloRank: toRank(solo),
    flexRank: toRank(flex),
    activeRegion,
  }
}

/** Data Dragon / CommunityDragon profile-icon image URL (version-free). */
export function getProfileIconUrl(profileIconId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profileIconId}.jpg`
}

/** CommunityDragon champion square icon (version-free), keyed by championId. */
export function getChampionIconUrl(championId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`
}

/** DDragon item icon keyed by item id. Item icons are stable across patches. */
const DDRAGON_VERSION = "15.13.1"
export function getItemIconUrl(itemId: number): string | null {
  if (!itemId) return null
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${itemId}.png`
}

const QUEUE_NAMES: Record<number, string> = {
  400: "Normale",
  420: "Classé Solo/Duo",
  430: "Normale",
  440: "Classé Flexible",
  450: "ARAM",
  490: "Partie rapide",
  700: "Clash",
  720: "Clash ARAM",
  900: "ARURF",
  1020: "Un pour tous",
  1300: "Nexus Blitz",
  1700: "Arena",
  1710: "Arena",
  1900: "URF",
}

export function queueName(queueId: number | null | undefined): string {
  return queueId != null ? (QUEUE_NAMES[queueId] ?? "Autre") : "Autre"
}

/** Classic Summoner's Rift queues (have meaningful build/skill order). */
export function isSummonersRift(queueId: number | null | undefined): boolean {
  return queueId != null && [400, 420, 430, 440, 490, 700].includes(queueId)
}

export interface MatchSummary {
  matchId: string
  championId: number
  championName: string
  win: boolean
  kills: number
  deaths: number
  assists: number
  cs: number
  teamKills: number
  queueId: number | null
  gameMode: string
  position: string | null
  gameCreationMs: number
  gameDurationS: number
  /** 0–100 contribution score (KP, damage share, KDA, CS) */
  carryScore: number
  /** the player's rank by carry score among all 10 participants (1 = best) */
  placement: number
  /** best score on own team: "MVP" if won, "ACE" if lost, else null */
  badge: "MVP" | "ACE" | null
  /** the direct lane opponent's champion (same teamPosition, enemy team) */
  laneOpponentChampionId: number | null
  /** highest-carry enemy + their position */
  enemyCarryChampionId: number | null
  enemyCarryPosition: string | null
  /** champion ids per side, for with/against filtering */
  allyChampionIds: number[]
  enemyChampionIds: number[]
  /** items equipped at the end of the game (slots 0–6, 0 = empty) */
  items: number[]
  /** the two summoner spell ids the player ran */
  summonerSpellIds: number[]
  /** keystone rune id (primary tree first selection) */
  keystoneId: number | null
  /** secondary tree first selection rune id */
  secondaryPerkId: number | null
}

// Reachable benchmarks (a full mark, not the theoretical max).
const BENCH = { kp: 0.65, dmg: 0.28, kda: 4, cspm: 8, vpm: 2, obj: 6, cc: 25, gold: 0.24 }

// Per-role weighting. Weights are normalized by their sum, so they don't need
// to add up to 1. Supports lean on KP/vision/CC, ADCs/mids on damage/CS/gold,
// junglers/tops on objectives — role-aware like opgg's OP Score.
interface RoleWeight {
  kp: number
  dmg: number
  kda: number
  cs: number
  vis: number
  obj: number
  cc: number
  gold: number
}

const DEFAULT_WEIGHTS: RoleWeight = {
  kp: 0.2,
  dmg: 0.22,
  kda: 0.18,
  cs: 0.12,
  vis: 0.04,
  obj: 0.12,
  cc: 0.06,
  gold: 0.06,
}

const ROLE_WEIGHTS: Record<string, RoleWeight> = {
  TOP: { kp: 0.18, dmg: 0.22, kda: 0.18, cs: 0.12, vis: 0.03, obj: 0.14, cc: 0.06, gold: 0.07 },
  JUNGLE: { kp: 0.22, dmg: 0.13, kda: 0.15, cs: 0.05, vis: 0.08, obj: 0.24, cc: 0.06, gold: 0.07 },
  MIDDLE: { kp: 0.2, dmg: 0.28, kda: 0.18, cs: 0.12, vis: 0.02, obj: 0.07, cc: 0.05, gold: 0.08 },
  BOTTOM: { kp: 0.15, dmg: 0.28, kda: 0.15, cs: 0.18, vis: 0.02, obj: 0.07, cc: 0.03, gold: 0.12 },
  UTILITY: { kp: 0.25, dmg: 0.07, kda: 0.15, cs: 0, vis: 0.23, obj: 0.06, cc: 0.19, gold: 0.05 },
}

/**
 * Raw 0–100 role-normalized performance score with reachable benchmarks.
 * Match history then scales these so the best player in the game ≈ 100
 * (relative, like dpm/opgg where the MVP tops out).
 */
export function computeCarryScore(p: {
  kills: number
  deaths: number
  assists: number
  cs: number
  durationS: number
  teamKills: number
  damage: number
  teamDamage: number
  visionScore?: number
  role?: string | null
  objectives?: number
  ccTime?: number
  gold?: number
  teamGold?: number
}): number {
  const w = ROLE_WEIGHTS[(p.role ?? "").toUpperCase()] ?? DEFAULT_WEIGHTS
  const kp = p.teamKills > 0 ? (p.kills + p.assists) / p.teamKills : 0
  const dmgShare = p.teamDamage > 0 ? p.damage / p.teamDamage : 0
  const kda = p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths
  const csPerMin = p.durationS > 0 ? p.cs / (p.durationS / 60) : 0
  const visPerMin = p.durationS > 0 ? (p.visionScore ?? 0) / (p.durationS / 60) : 0
  const goldShare = p.teamGold && p.teamGold > 0 ? (p.gold ?? 0) / p.teamGold : 0

  const components: [number, number][] = [
    [w.kp, Math.min(kp / BENCH.kp, 1)],
    [w.dmg, Math.min(dmgShare / BENCH.dmg, 1)],
    [w.kda, Math.min(kda / BENCH.kda, 1)],
    [w.cs, Math.min(csPerMin / BENCH.cspm, 1)],
    [w.vis, Math.min(visPerMin / BENCH.vpm, 1)],
    [w.obj, Math.min((p.objectives ?? 0) / BENCH.obj, 1)],
    [w.cc, Math.min((p.ccTime ?? 0) / BENCH.cc, 1)],
    [w.gold, Math.min(goldShare / BENCH.gold, 1)],
  ]
  const totalW = components.reduce((s, [weight]) => s + weight, 0) || 1
  const score = (100 * components.reduce((s, [weight, v]) => s + weight * v, 0)) / totalW
  return Math.max(0, Math.min(100, score))
}

/**
 * Fetches the player's recent matches (all queues by default) and reduces each
 * to the target player's line — what opgg/dpm render in the match list.
 * Pass a `queue` id to restrict to a single queue.
 */
export async function getMatchHistory(
  client: RiotApiClient,
  region: Region,
  puuid: string,
  count = 10,
  queue?: number,
  start = 0
): Promise<MatchSummary[]> {
  const routing = regionToRouting(region)
  const ids = await getMatchIds(client, routing, puuid, {
    count,
    start,
    ...(queue !== undefined ? { queue } : {}),
  })

  const matches = await Promise.all(
    ids.map((id) =>
      getMatch(client, routing, id)
        .then((m): MatchSummary | null => {
          const p = m.info.participants.find((x) => x.puuid === puuid)
          if (!p) return null
          const dur = m.info.gameDuration

          // Team aggregates (kills + damage + gold) for every team.
          const teamAgg = new Map<number, { kills: number; damage: number; gold: number }>()
          for (const x of m.info.participants) {
            const t = teamAgg.get(x.teamId) ?? { kills: 0, damage: 0, gold: 0 }
            t.kills += x.kills
            t.damage += x.totalDamageDealtToChampions ?? 0
            t.gold += x.goldEarned ?? 0
            teamAgg.set(x.teamId, t)
          }

          // Raw role-normalized score for all 10, to rank + scale relative.
          const scored = m.info.participants.map((x) => {
            const ta = teamAgg.get(x.teamId) ?? { kills: 0, damage: 0, gold: 0 }
            const xcs = (x.totalMinionsKilled ?? 0) + (x.neutralMinionsKilled ?? 0)
            return {
              puuid: x.puuid,
              teamId: x.teamId,
              championId: x.championId,
              position: x.teamPosition ?? x.individualPosition ?? null,
              score: computeCarryScore({
                kills: x.kills,
                deaths: x.deaths,
                assists: x.assists,
                cs: xcs,
                durationS: dur,
                teamKills: ta.kills,
                damage: x.totalDamageDealtToChampions ?? 0,
                teamDamage: ta.damage,
                visionScore: x.visionScore ?? 0,
                role: x.teamPosition ?? x.individualPosition ?? null,
                objectives: (x.dragonKills ?? 0) + (x.baronKills ?? 0) + (x.turretTakedowns ?? 0),
                ccTime: x.timeCCingOthers ?? 0,
                gold: x.goldEarned ?? 0,
                teamGold: ta.gold,
              }),
            }
          })

          const ownRaw = scored.find((s) => s.puuid === puuid)?.score ?? 0
          // Relative: best player in the game → 100.
          const gameMax = Math.max(...scored.map((s) => s.score), 1)
          const carryScore = Math.round((100 * ownRaw) / gameMax)
          const placement =
            [...scored].sort((a, b) => b.score - a.score).findIndex((s) => s.puuid === puuid) + 1
          const teamMax = Math.max(
            ...scored.filter((s) => s.teamId === p.teamId).map((s) => s.score)
          )
          const badge: "MVP" | "ACE" | null = ownRaw === teamMax ? (p.win ? "MVP" : "ACE") : null

          const ownPos = p.teamPosition ?? p.individualPosition ?? null
          const enemies = scored.filter((s) => s.teamId !== p.teamId)
          const laneOpp = ownPos ? enemies.find((s) => s.position === ownPos) : undefined
          const enemyCarry = enemies.reduce<(typeof enemies)[number] | undefined>(
            (best, s) => (!best || s.score > best.score ? s : best),
            undefined
          )

          const teamKills = teamAgg.get(p.teamId)?.kills ?? 0
          const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)
          return {
            matchId: m.metadata.matchId,
            championId: p.championId,
            championName: p.championName,
            win: p.win,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            cs,
            teamKills,
            queueId: m.info.queueId ?? null,
            gameMode: m.info.gameMode,
            position: ownPos,
            gameCreationMs: m.info.gameCreation,
            gameDurationS: dur,
            carryScore,
            placement,
            badge,
            laneOpponentChampionId: laneOpp?.championId ?? null,
            enemyCarryChampionId: enemyCarry?.championId ?? null,
            enemyCarryPosition: enemyCarry?.position ?? null,
            allyChampionIds: scored.filter((s) => s.teamId === p.teamId).map((s) => s.championId),
            enemyChampionIds: enemies.map((s) => s.championId),
            items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map(
              (i) => i ?? 0
            ),
            summonerSpellIds: [p.summoner1Id ?? 0, p.summoner2Id ?? 0],
            keystoneId: p.perks?.styles?.[0]?.selections?.[0]?.perk ?? null,
            secondaryPerkId: p.perks?.styles?.[1]?.selections?.[0]?.perk ?? null,
          }
        })
        .catch(() => null)
    )
  )

  return matches.filter((m): m is MatchSummary => m !== null)
}

export interface ChampionBucket {
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
}

export interface ChampionAggregate {
  championId: number
  championName: string
  total: ChampionBucket
  solo: ChampionBucket
  flex: ChampionBucket
}

function emptyBucket(): ChampionBucket {
  return { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
}

function addToBucket(b: ChampionBucket, p: { win: boolean; k: number; d: number; a: number }) {
  b.games += 1
  b.wins += p.win ? 1 : 0
  b.kills += p.k
  b.deaths += p.d
  b.assists += p.a
}

/**
 * Aggregates per-champion winrate across the player's ranked games, split into
 * Solo/Duo (420) and Flex (440) buckets plus a combined total — like opgg's
 * "champions" panel. One ranked match-list call + N detail calls.
 */
export async function getChampionStats(
  client: RiotApiClient,
  region: Region,
  puuid: string,
  count = 30
): Promise<ChampionAggregate[]> {
  const routing = regionToRouting(region)
  const ids = await getMatchIds(client, routing, puuid, { type: "ranked", count })

  const byChamp = new Map<number, ChampionAggregate>()

  await Promise.all(
    ids.map((id) =>
      getMatch(client, routing, id)
        .then((m) => {
          const p = m.info.participants.find((x) => x.puuid === puuid)
          if (!p) return
          const agg = byChamp.get(p.championId) ?? {
            championId: p.championId,
            championName: p.championName,
            total: emptyBucket(),
            solo: emptyBucket(),
            flex: emptyBucket(),
          }
          const line = { win: p.win, k: p.kills, d: p.deaths, a: p.assists }
          addToBucket(agg.total, line)
          if (m.info.queueId === 420) addToBucket(agg.solo, line)
          else if (m.info.queueId === 440) addToBucket(agg.flex, line)
          byChamp.set(p.championId, agg)
        })
        .catch(() => {})
    )
  )

  return [...byChamp.values()].sort((a, b) => b.total.games - a.total.games)
}

export interface AverageGameRank {
  tier: TierName
  division: Division
  /** how many recent games were sampled */
  sampleGames: number
  /** how many ranked participants contributed to the median */
  sampledPlayers: number
}

/**
 * The "rang moyen des parties" from the design — replaces a numeric MMR with the
 * MEDIAN rank of every participant across the player's last `games` ranked games.
 * Heavy on API calls (≈ games × 10 league lookups); keep `games` small and lazy.
 */
export async function getAverageGameRank(
  client: RiotApiClient,
  region: Region,
  puuid: string,
  games = 3,
  queue = 420
): Promise<AverageGameRank | null> {
  const routing = regionToRouting(region)
  const ids = await getMatchIds(client, routing, puuid, { queue, count: games })
  const matches = await Promise.all(
    ids.map((id) => getMatch(client, routing, id).catch(() => null))
  )

  const participantPuuids = new Set<string>()
  let sampledGames = 0
  for (const m of matches) {
    if (!m) continue
    sampledGames += 1
    for (const p of m.info.participants) participantPuuids.add(p.puuid)
  }
  if (participantPuuids.size === 0) return null

  const entries = await Promise.all(
    [...participantPuuids].map((pid) =>
      getLeagueEntriesByPuuid(client, region, pid).catch(() => [])
    )
  )

  const ranks: RankedEntry[] = []
  for (const list of entries) {
    const solo = list.find((e) => e.queueType === "RANKED_SOLO_5x5")
    if (solo) {
      ranks.push({
        tier: capitalizeTier(solo.tier),
        division: solo.rank as Division,
        leaguePoints: solo.leaguePoints,
      })
    }
  }
  if (ranks.length === 0) return null

  const { tier, division } = computeAverageGameRank(ranks)
  return { tier, division, sampleGames: sampledGames, sampledPlayers: ranks.length }
}
