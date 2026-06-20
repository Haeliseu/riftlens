import { SEASON_2_2026_START_MS } from "./season"

export interface PreviouslyPlayedInfo {
  totalGames: number
  asAlly: number
  asEnemy: number
  wins: number
  losses: number
  lastPlayedMs: number
}

// SQL query (Drizzle equivalent):
// SELECT mp1.match_id, mp1.team_id AS my_team, mp2.team_id AS their_team,
//        mp1.win AS my_win, m.game_creation
// FROM match_participants mp1
// JOIN match_participants mp2 ON mp1.match_id = mp2.match_id
// JOIN matches m ON mp1.match_id = m.match_id
// WHERE mp1.puuid = :myPuuid AND mp2.puuid = :theirPuuid
//   AND m.game_creation >= :seasonStart
// ORDER BY m.game_creation DESC LIMIT 50
export interface CommonGame {
  matchId: string
  myTeamId: number
  theirTeamId: number
  myWin: boolean
  gameCreation: number
}

export function aggregatePreviouslyPlayed(
  commonGames: CommonGame[]
): PreviouslyPlayedInfo | null {
  const seasonGames = commonGames.filter((g) => g.gameCreation >= SEASON_2_2026_START_MS)
  if (seasonGames.length === 0) return null

  let asAlly = 0
  let asEnemy = 0
  let wins = 0
  let losses = 0
  let lastPlayedMs = 0

  for (const game of seasonGames) {
    if (game.myTeamId === game.theirTeamId) {
      asAlly++
    } else {
      asEnemy++
    }
    if (game.myWin) {
      wins++
    } else {
      losses++
    }
    if (game.gameCreation > lastPlayedMs) {
      lastPlayedMs = game.gameCreation
    }
  }

  return {
    totalGames: seasonGames.length,
    asAlly,
    asEnemy,
    wins,
    losses,
    lastPlayedMs,
  }
}
