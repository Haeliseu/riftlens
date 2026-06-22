import type { Participant, Region } from "@riftlens/riot-api"
import {
  computeCarryScore,
  getLeagueEntriesByPuuid,
  getMatch,
  regionToRouting,
} from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { resolveAssets } from "@/lib/cdragon"
import { PING_FIELDS, pingIconUrl } from "@/lib/pings"
import { cachedRanks, cacheParticipantRank } from "@/lib/profile-db"
import { riotClient } from "@/lib/riot-client"

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const region = (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
  const routing = regionToRouting(region)
  const client = riotClient()

  try {
    // The match itself is immutable; per-player ranks change slowly. Cache the
    // whole computed payload (10 league lookups + parsing) for an hour.
    const payload = await withCache(`md:${region}:${matchId}`, 3600, async () => {
      const m = await getMatch(client, routing, matchId)
      const assets = await resolveAssets()
      const dur = m.info.gameDuration || 0

      // Team aggregates (kills / damage / gold) for carry score + KP.
      const teamAgg = new Map<number, { kills: number; damage: number; gold: number }>()
      for (const x of m.info.participants) {
        const a = teamAgg.get(x.teamId) ?? { kills: 0, damage: 0, gold: 0 }
        a.kills += x.kills
        a.damage += x.totalDamageDealtToChampions ?? 0
        a.gold += x.goldEarned ?? 0
        teamAgg.set(x.teamId, a)
      }

      // Raw role-normalized carry score for all 10 → relative scaling + placement.
      const rawScore = (x: Participant): number => {
        const a = teamAgg.get(x.teamId) ?? { kills: 0, damage: 0, gold: 0 }
        const xcs = (x.totalMinionsKilled ?? 0) + (x.neutralMinionsKilled ?? 0)
        return computeCarryScore({
          kills: x.kills,
          deaths: x.deaths,
          assists: x.assists,
          cs: xcs,
          durationS: dur,
          teamKills: a.kills,
          damage: x.totalDamageDealtToChampions ?? 0,
          teamDamage: a.damage,
          visionScore: x.visionScore ?? 0,
          role: x.teamPosition ?? x.individualPosition ?? null,
          objectives: (x.dragonKills ?? 0) + (x.baronKills ?? 0) + (x.turretTakedowns ?? 0),
          ccTime: x.timeCCingOthers ?? 0,
          gold: x.goldEarned ?? 0,
          teamGold: a.gold,
        })
      }
      const scores = new Map(m.info.participants.map((x) => [x.puuid, rawScore(x)]))
      const gameMax = Math.max(...scores.values(), 1)
      const gameMaxDamage = Math.max(
        ...m.info.participants.map((x) => x.totalDamageDealtToChampions ?? 0),
        1
      )
      const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
      const placementOf = new Map(ranked.map(([puuid], i) => [puuid, i + 1]))
      const teamMax = new Map<number, number>()
      for (const x of m.info.participants) {
        teamMax.set(x.teamId, Math.max(teamMax.get(x.teamId) ?? 0, scores.get(x.puuid) ?? 0))
      }

      // Per-player Solo rank — cache first, fill misses from league-v4.
      const puuids = m.info.participants.map((p) => p.puuid)
      const cache = await cachedRanks(puuids).catch(() => new Map())
      const rankByPuuid = new Map<string, { tier: string; division: string; lp: number }>()
      // Cap live league-v4 lookups so opening a match can't blow the dev-key rate
      // limit (which would starve average-rank / live-game). Cached ranks are free.
      let liveBudget = 4
      for (const p of m.info.participants) {
        const c = cache.get(p.puuid)
        if (c) {
          rankByPuuid.set(p.puuid, { tier: c.tier, division: c.division, lp: c.leaguePoints })
          continue
        }
        if (liveBudget <= 0) continue
        liveBudget -= 1
        const entries = await getLeagueEntriesByPuuid(client, region, p.puuid).catch(() => [])
        const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5")
        if (solo) {
          rankByPuuid.set(p.puuid, { tier: solo.tier, division: solo.rank, lp: solo.leaguePoints })
          await cacheParticipantRank(p.puuid, region, {
            tier: solo.tier,
            division: solo.rank,
            leaguePoints: solo.leaguePoints,
          }).catch(() => {})
        }
      }

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
          key: f.key,
          icon: pingIconUrl(f.icon),
          count: (p[f.key as keyof Participant] as number | undefined) ?? 0,
        })).filter((x) => x.count > 0)
        const totalPings = pings.reduce((s, x) => s + x.count, 0)

        const own = scores.get(p.puuid) ?? 0
        const teamKills = teamAgg.get(p.teamId)?.kills ?? 0
        const damage = p.totalDamageDealtToChampions ?? 0
        const rank = rankByPuuid.get(p.puuid) ?? null
        const isBest = own === teamMax.get(p.teamId)

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
          goldPerMin: dur > 0 ? Math.round((p.goldEarned ?? 0) / (dur / 60)) : 0,
          damage,
          damageShare: gameMaxDamage > 0 ? Math.round((damage / gameMaxDamage) * 100) : 0,
          damageTaken: p.totalDamageTaken ?? 0,
          visionScore: p.visionScore ?? 0,
          visionPerMin: dur > 0 ? +((p.visionScore ?? 0) / (dur / 60)).toFixed(1) : 0,
          wardsPlaced: p.wardsPlaced ?? 0,
          wardsKilled: p.wardsKilled ?? 0,
          controlWards: p.detectorWardsPlaced ?? 0,
          kp: teamKills > 0 ? Math.round(((p.kills + p.assists) / teamKills) * 100) : 0,
          carryScore: Math.round((100 * own) / gameMax),
          placement: placementOf.get(p.puuid) ?? 0,
          badge: isBest ? (p.win ? "MVP" : "ACE") : null,
          tier: rank?.tier ?? null,
          division: rank?.division ?? null,
          lp: rank?.lp ?? null,
          spellCasts: [
            p.spell1Casts ?? 0,
            p.spell2Casts ?? 0,
            p.spell3Casts ?? 0,
            p.spell4Casts ?? 0,
          ],
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

      // Per-team objective totals (towers / dragons / barons / heralds / grubs / kills).
      const teams = (m.info.teams ?? []).map((t) => ({
        teamId: t.teamId,
        win: t.win ?? false,
        kills: t.objectives?.champion?.kills ?? teamAgg.get(t.teamId)?.kills ?? 0,
        towers: t.objectives?.tower?.kills ?? 0,
        dragons: t.objectives?.dragon?.kills ?? 0,
        barons: t.objectives?.baron?.kills ?? 0,
        heralds: t.objectives?.riftHerald?.kills ?? 0,
        grubs: t.objectives?.horde?.kills ?? 0,
        inhibitors: t.objectives?.inhibitor?.kills ?? 0,
      }))

      return {
        matchId,
        region,
        queueId: m.info.queueId ?? null,
        gameDurationS: dur,
        participants,
        teams,
      }
    })

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return NextResponse.json({ error: String(err) }, { status })
  }
}
