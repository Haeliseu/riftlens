import { z } from "zod"
import type { RiotApiClient, Region } from "../client"

const ChampionMasterySchema = z.object({
  puuid: z.string().optional(),
  championId: z.number(),
  championLevel: z.number(),
  championPoints: z.number(),
  lastPlayTime: z.number(),
  championPointsSinceLastLevel: z.number(),
  championPointsUntilNextLevel: z.number(),
  tokensEarned: z.number().optional(),
})

const ChampionMasteryListSchema = z.array(ChampionMasterySchema)

export type ChampionMastery = z.infer<typeof ChampionMasterySchema>

export async function getTopChampionMasteries(
  client: RiotApiClient,
  region: Region,
  puuid: string,
  count = 7
): Promise<ChampionMastery[]> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`
  return client.fetch(url, ChampionMasteryListSchema)
}
