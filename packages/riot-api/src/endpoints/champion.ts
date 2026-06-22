import { z } from "zod"
import type { Region, RiotApiClient } from "../client"

const ChampionRotationSchema = z.object({
  freeChampionIds: z.array(z.number()),
  freeChampionIdsForNewPlayers: z.array(z.number()),
  maxNewPlayerLevel: z.number(),
})

export type ChampionRotation = z.infer<typeof ChampionRotationSchema>

/** champion-v3: the current free champion rotation. */
export async function getChampionRotation(
  client: RiotApiClient,
  region: Region
): Promise<ChampionRotation> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/platform/v3/champion-rotations`
  return client.fetch(url, ChampionRotationSchema)
}
