import type { SessionStats } from "./session"

export type PlayerTag =
  | "on-fire"
  | "tilting"
  | "one-trick"
  | "carry-potential"
  | "smurf-risk"
  | "fed-last-game"

export function computePlayerTags(params: {
  session: SessionStats
  champWinRate: number
  champGames: number
  totalGames: number
  lastGameKDA: [number, number, number]
  recentChampGames: number
}): PlayerTag[] {
  const { session, champWinRate, champGames, totalGames, lastGameKDA, recentChampGames } = params
  const tags: PlayerTag[] = []

  if (session.streak <= -3) tags.push("tilting")
  if (session.streak >= 3) tags.push("on-fire")
  if (champGames >= 20 && recentChampGames / 30 >= 0.6) tags.push("one-trick")

  const [k, d, a] = lastGameKDA
  const kda = d === 0 ? k + a : (k + a) / d
  if (champWinRate >= 58 && kda >= 4.0) tags.push("carry-potential")
  if (totalGames < 30 && champWinRate >= 70) tags.push("smurf-risk")
  if (lastGameKDA[0] >= 15 || kda >= 8) tags.push("fed-last-game")

  return tags
}
