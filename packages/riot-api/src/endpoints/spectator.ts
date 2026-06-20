import type { RiotApiClient, Region } from "../client"
import { LiveGameSchema, type LiveGame } from "../types/live-game"

export async function getLiveGame(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<LiveGame> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`
  return client.fetch(url, LiveGameSchema)
}
