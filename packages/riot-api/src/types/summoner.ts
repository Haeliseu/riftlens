import { z } from "zod"

export const SummonerDtoSchema = z.object({
  // Encrypted IDs are being phased out by Riot and are now absent from
  // summoner-v4/by-puuid responses — keep optional for forward-compat.
  id: z.string().optional(),
  accountId: z.string().optional(),
  puuid: z.string(),
  profileIconId: z.number(),
  revisionDate: z.number(),
  summonerLevel: z.number(),
})

export type SummonerDto = z.infer<typeof SummonerDtoSchema>
