import { z } from "zod"

export const AccountDtoSchema = z.object({
  puuid: z.string(),
  gameName: z.string().optional(),
  tagLine: z.string().optional(),
})

export type AccountDto = z.infer<typeof AccountDtoSchema>
