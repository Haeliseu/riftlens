import { z } from "zod"

export const SummonerDtoSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  puuid: z.string(),
  profileIconId: z.number(),
  revisionDate: z.number(),
  summonerLevel: z.number(),
})

export type SummonerDto = z.infer<typeof SummonerDtoSchema>
