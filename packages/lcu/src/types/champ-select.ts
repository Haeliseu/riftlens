import { z } from "zod"

export const ChampSelectActionSchema = z.object({
  id: z.number(),
  actorCellId: z.number(),
  championId: z.number(),
  completed: z.boolean(),
  type: z.string(),
})

export const ChampSelectPlayerSchema = z.object({
  cellId: z.number(),
  championId: z.number(),
  championPickIntent: z.number(),
  puuid: z.string().optional(),
  summonerId: z.number(),
  teamId: z.number(),
  assignedPosition: z.string().optional(),
  displayName: z.string().optional(),
})

export const ChampSelectSessionSchema = z.object({
  myTeam: z.array(ChampSelectPlayerSchema),
  theirTeam: z.array(ChampSelectPlayerSchema),
  actions: z.array(z.array(ChampSelectActionSchema)),
  localPlayerCellId: z.number(),
  timer: z
    .object({
      phase: z.string(),
      timeLeftInPhase: z.number(),
      totalTimeInPhase: z.number(),
    })
    .optional(),
})

export type ChampSelectSession = z.infer<typeof ChampSelectSessionSchema>
export type ChampSelectPlayer = z.infer<typeof ChampSelectPlayerSchema>
