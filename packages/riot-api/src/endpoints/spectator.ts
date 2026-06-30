import { z } from "zod"
import type { Region, RiotApiClient } from "../client"
import { type LiveGame, LiveGameSchema } from "../types/live-game"

export async function getLiveGame(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<LiveGame> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`
  return client.fetch(url, LiveGameSchema)
}

const FeaturedParticipantSchema = z
  .object({
    teamId: z.number(),
    championId: z.number(),
    spell1Id: z.number().optional(),
    spell2Id: z.number().optional(),
    summonerName: z.string().optional(),
    riotId: z.string().optional(),
    bot: z.boolean().optional(),
  })
  .passthrough()

const FeaturedGameSchema = z
  .object({
    gameId: z.number(),
    gameMode: z.string().optional(),
    gameQueueConfigId: z.number().optional(),
    mapId: z.number().optional(),
    gameLength: z.number().optional(),
    participants: z.array(FeaturedParticipantSchema),
  })
  .passthrough()

const FeaturedGamesSchema = z
  .object({
    gameList: z.array(FeaturedGameSchema).default([]),
    clientRefreshInterval: z.number().optional(),
  })
  .passthrough()

export type FeaturedGames = z.infer<typeof FeaturedGamesSchema>

/** A handful of in-progress games Riot surfaces (no puuid → not profile-linkable). */
export async function getFeaturedGames(
  client: RiotApiClient,
  region: Region
): Promise<FeaturedGames> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/spectator/v5/featured-games`
  return client.fetch(url, FeaturedGamesSchema)
}
