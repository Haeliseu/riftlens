import { isCurrentSeason } from "./season"

export interface SessionStats {
  wins: number
  losses: number
  winRate: number // 0–100
  gamesPlayed: number
  streak: number // >0 = win streak, <0 = loss streak
}

export function computeSessionStats(
  matches: Array<{ gameCreation: number; win: boolean; puuid: string }>,
  puuid: string
): SessionStats {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const startMs = todayStart.getTime()

  const todayMatches = matches
    .filter(
      (m) => m.puuid === puuid && m.gameCreation >= startMs && isCurrentSeason(m.gameCreation)
    )
    .sort((a, b) => b.gameCreation - a.gameCreation)

  const wins = todayMatches.filter((m) => m.win).length
  const losses = todayMatches.length - wins

  let streak = 0
  for (const m of todayMatches) {
    if (streak === 0) {
      streak = m.win ? 1 : -1
      continue
    }
    if (m.win && streak > 0) streak++
    else if (!m.win && streak < 0) streak--
    else break
  }

  return {
    wins,
    losses,
    winRate: todayMatches.length > 0 ? Math.round((wins / todayMatches.length) * 100) : 0,
    gamesPlayed: todayMatches.length,
    streak,
  }
}
