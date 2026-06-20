import type { SessionStats } from "./session"

// Riot dev policy forbids shaming players on performance metrics, so tags are
// honoring/informational only — no "tilting", "smurf-risk" or similar.
export type PlayerTag = "on-fire" | "one-trick" | "carry-potential" | "fed-last-game"

export function computePlayerTags(params: {
  session: SessionStats
  champWinRate: number
  champGames: number
  lastGameKDA: [number, number, number]
  recentChampGames: number
}): PlayerTag[] {
  const { session, champWinRate, champGames, lastGameKDA, recentChampGames } = params
  const tags: PlayerTag[] = []

  if (session.streak >= 3) tags.push("on-fire")
  if (champGames >= 20 && recentChampGames / 30 >= 0.6) tags.push("one-trick")

  const [k, d, a] = lastGameKDA
  const kda = d === 0 ? k + a : (k + a) / d
  if (champWinRate >= 58 && kda >= 4.0) tags.push("carry-potential")
  if (lastGameKDA[0] >= 15 || kda >= 8) tags.push("fed-last-game")

  return tags
}
