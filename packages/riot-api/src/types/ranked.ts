import { z } from "zod"

export const LeagueEntrySchema = z.object({
  leagueId: z.string().optional(),
  summonerId: z.string(),
  queueType: z.string(),
  tier: z.string(),
  rank: z.string(),
  leaguePoints: z.number(),
  wins: z.number(),
  losses: z.number(),
  hotStreak: z.boolean().optional(),
  veteran: z.boolean().optional(),
  freshBlood: z.boolean().optional(),
  inactive: z.boolean().optional(),
})

export const LeagueEntriesSchema = z.array(LeagueEntrySchema)

export type LeagueEntry = z.infer<typeof LeagueEntrySchema>
