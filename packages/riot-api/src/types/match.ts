import { z } from "zod"

export const ParticipantSchema = z.object({
  puuid: z.string(),
  summonerName: z.string().optional(),
  riotIdGameName: z.string().optional(),
  riotIdTagline: z.string().optional(),
  teamId: z.number(),
  championId: z.number(),
  championName: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  win: z.boolean(),
  role: z.string().optional(),
  lane: z.string().optional(),
  goldEarned: z.number().optional(),
  totalDamageDealtToChampions: z.number().optional(),
  visionScore: z.number().optional(),
  totalMinionsKilled: z.number().optional(),
  neutralMinionsKilled: z.number().optional(),
  individualPosition: z.string().optional(),
  teamPosition: z.string().optional(),
})

export const MatchInfoSchema = z.object({
  gameId: z.number(),
  gameCreation: z.number(),
  gameDuration: z.number(),
  gameMode: z.string(),
  gameType: z.string(),
  gameVersion: z.string().optional(),
  mapId: z.number().optional(),
  participants: z.array(ParticipantSchema),
  platformId: z.string().optional(),
  queueId: z.number().optional(),
})

export const MatchDtoSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    dataVersion: z.string().optional(),
    participants: z.array(z.string()),
  }),
  info: MatchInfoSchema,
})

export const MatchListSchema = z.array(z.string())

export type MatchDto = z.infer<typeof MatchDtoSchema>
export type MatchInfo = z.infer<typeof MatchInfoSchema>
export type Participant = z.infer<typeof ParticipantSchema>
