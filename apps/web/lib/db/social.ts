import { db } from "@riftlens/db"
import { matchParticipants, summonerMatches } from "@riftlens/db/schema"
import { eq, inArray } from "drizzle-orm"

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
