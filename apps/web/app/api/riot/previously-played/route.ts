import { db } from "@riftlens/db"
import { matchParticipants, matches } from "@riftlens/db/schema"
import { aggregatePreviouslyPlayed } from "@riftlens/riot-api"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const myPuuid = searchParams.get("my")
  const theirPuuid = searchParams.get("their")

  if (!myPuuid || !theirPuuid) {
    return NextResponse.json({ error: "Missing my or their puuid" }, { status: 400 })
  }

  const commonGamesRaw = await db
    .select({
      matchId: matchParticipants.matchId,
      myTeamId: matchParticipants.teamId,
      myWin: matchParticipants.win,
      gameCreation: matches.gameCreation,
    })
    .from(matchParticipants)
    .innerJoin(matches, eq(matchParticipants.matchId, matches.matchId))
    .where(
      and(
        eq(matchParticipants.puuid, myPuuid)
      )
    )
    .orderBy()
    .limit(50)

  // Get their team IDs for the same matches
  const theirMatchIds = commonGamesRaw.map((g) => g.matchId).filter(Boolean) as string[]

  if (theirMatchIds.length === 0) {
    return NextResponse.json(null, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    })
  }

  const theirEntries = await db
    .select({
      matchId: matchParticipants.matchId,
      teamId: matchParticipants.teamId,
    })
    .from(matchParticipants)
    .where(eq(matchParticipants.puuid, theirPuuid))

  const theirTeamByMatch = new Map(theirEntries.map((e) => [e.matchId, e.teamId]))

  const commonGames = commonGamesRaw
    .filter((g) => g.matchId && theirTeamByMatch.has(g.matchId))
    .map((g) => ({
      matchId: g.matchId!,
      myTeamId: g.myTeamId ?? 0,
      theirTeamId: theirTeamByMatch.get(g.matchId!) ?? 0,
      myWin: g.myWin ?? false,
      gameCreation: g.gameCreation ?? 0,
    }))

  const result = aggregatePreviouslyPlayed(commonGames)

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  })
}
