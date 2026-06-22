import { z } from "zod"

export const LiveGameParticipantSchema = z.object({
  puuid: z.string().optional(),
  // Riot removed encrypted IDs from spectator-v5 — summonerId is no longer
  // returned for many participants, so it must stay optional.
  summonerId: z.string().optional(),
  summonerName: z.string().optional(),
  riotId: z.string().optional(),
  teamId: z.number(),
  championId: z.number(),
  profileIconId: z.number().optional(),
  perks: z
    .object({
      perkStyle: z.number(),
      perkSubStyle: z.number(),
      perkIds: z.array(z.number()),
    })
    .optional(),
})

export const LiveGameSchema = z.object({
  gameId: z.number(),
  gameType: z.string().optional(),
  gameStartTime: z.number(),
  mapId: z.number().optional(),
  gameLength: z.number().optional(),
  platformId: z.string().optional(),
  gameMode: z.string().optional(),
  gameQueueConfigId: z.number().optional(),
  participants: z.array(LiveGameParticipantSchema),
  bannedChampions: z
    .array(
      z.object({
        championId: z.number(),
        teamId: z.number(),
        pickTurn: z.number(),
      })
    )
    .optional(),
})

export type LiveGame = z.infer<typeof LiveGameSchema>
export type LiveGameParticipant = z.infer<typeof LiveGameParticipantSchema>
