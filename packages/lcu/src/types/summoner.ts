import { z } from "zod"

export const LcuSummonerSchema = z.object({
  accountId: z.number(),
  displayName: z.string(),
  internalName: z.string().optional(),
  nameChangeFlag: z.boolean().optional(),
  percentCompleteForNextLevel: z.number().optional(),
  privacy: z.string().optional(),
  profileIconId: z.number(),
  puuid: z.string(),
  rerollPoints: z
    .object({
      currentPoints: z.number(),
      maxRolls: z.number(),
      numberOfRolls: z.number(),
      pointsCostToRoll: z.number(),
      pointsToReroll: z.number(),
    })
    .optional(),
  summonerId: z.number(),
  summonerLevel: z.number(),
  xpSinceLastLevel: z.number().optional(),
  xpUntilNextLevel: z.number().optional(),
})

export type LcuSummoner = z.infer<typeof LcuSummonerSchema>
