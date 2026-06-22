import { z } from "zod"
import type { Region, RiotApiClient } from "../client"

const ChallengePointsSchema = z.object({
  level: z.string(),
  current: z.number(),
  max: z.number(),
  percentile: z.number().optional(),
})

const ChallengeInfoSchema = z.object({
  challengeId: z.number(),
  percentile: z.number().optional(),
  level: z.string(),
  value: z.number(),
  achievedTime: z.number().optional(),
})

const PlayerChallengesSchema = z.object({
  totalPoints: ChallengePointsSchema,
  categoryPoints: z.record(z.string(), ChallengePointsSchema).optional(),
  challenges: z.array(ChallengeInfoSchema).optional(),
  preferences: z
    .object({
      bannerAccent: z.string().optional(),
      title: z.string().optional(),
      challengeIds: z.array(z.number()).optional(),
      prestigeCrestBorderLevel: z.number().optional(),
    })
    .optional(),
})

export type PlayerChallenges = z.infer<typeof PlayerChallengesSchema>

/** lol-challenges-v1: a player's challenge points, levels and selected title. */
export async function getPlayerChallenges(
  client: RiotApiClient,
  region: Region,
  puuid: string
): Promise<PlayerChallenges> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/challenges/v1/player-data/${puuid}`
  return client.fetch(url, PlayerChallengesSchema)
}
