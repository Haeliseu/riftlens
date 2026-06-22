import { z } from "zod"

export const ParticipantSchema = z.object({
  puuid: z.string(),
  summonerName: z.string().optional(),
  riotIdGameName: z.string().optional(),
  riotIdTagline: z.string().optional(),
  profileIcon: z.number().optional(),
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
  totalDamageTaken: z.number().optional(),
  visionScore: z.number().optional(),
  wardsPlaced: z.number().optional(),
  wardsKilled: z.number().optional(),
  detectorWardsPlaced: z.number().optional(),
  totalMinionsKilled: z.number().optional(),
  neutralMinionsKilled: z.number().optional(),
  individualPosition: z.string().optional(),
  teamPosition: z.string().optional(),
  champLevel: z.number().optional(),
  // Objectives / CC / spell casts (for carry score + details)
  dragonKills: z.number().optional(),
  baronKills: z.number().optional(),
  turretTakedowns: z.number().optional(),
  timeCCingOthers: z.number().optional(),
  spell1Casts: z.number().optional(),
  spell2Casts: z.number().optional(),
  spell3Casts: z.number().optional(),
  spell4Casts: z.number().optional(),
  // Items (0..6) + summoner spells
  item0: z.number().optional(),
  item1: z.number().optional(),
  item2: z.number().optional(),
  item3: z.number().optional(),
  item4: z.number().optional(),
  item5: z.number().optional(),
  item6: z.number().optional(),
  summoner1Id: z.number().optional(),
  summoner2Id: z.number().optional(),
  // Runes
  perks: z
    .object({
      statPerks: z
        .object({ offense: z.number(), flex: z.number(), defense: z.number() })
        .optional(),
      styles: z
        .array(
          z.object({
            description: z.string().optional(),
            style: z.number(),
            selections: z.array(z.object({ perk: z.number() })),
          })
        )
        .optional(),
    })
    .optional(),
  // Pings
  allInPings: z.number().optional(),
  assistMePings: z.number().optional(),
  basicPings: z.number().optional(),
  commandPings: z.number().optional(),
  dangerPings: z.number().optional(),
  enemyMissingPings: z.number().optional(),
  enemyVisionPings: z.number().optional(),
  getBackPings: z.number().optional(),
  holdPings: z.number().optional(),
  needVisionPings: z.number().optional(),
  onMyWayPings: z.number().optional(),
  pushPings: z.number().optional(),
  retreatPings: z.number().optional(),
  visionClearedPings: z.number().optional(),
})

const ObjectiveSchema = z.object({ first: z.boolean().optional(), kills: z.number().optional() })

export const TeamSchema = z.object({
  teamId: z.number(),
  win: z.boolean().optional(),
  objectives: z
    .object({
      baron: ObjectiveSchema.optional(),
      champion: ObjectiveSchema.optional(),
      dragon: ObjectiveSchema.optional(),
      horde: ObjectiveSchema.optional(),
      inhibitor: ObjectiveSchema.optional(),
      riftHerald: ObjectiveSchema.optional(),
      tower: ObjectiveSchema.optional(),
    })
    .optional(),
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
  teams: z.array(TeamSchema).optional(),
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
