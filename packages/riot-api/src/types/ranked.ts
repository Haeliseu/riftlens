import { z } from "zod"

export const LeagueEntrySchema = z.object({
  leagueId: z.string().optional(),
  // Encrypted summonerId is being phased out and is absent from
  // league-v4/entries/by-puuid responses — keep optional.
  summonerId: z.string().optional(),
  puuid: z.string().optional(),
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

export const LeagueItemSchema = z.object({
  puuid: z.string().optional(),
  summonerId: z.string().optional(),
  leaguePoints: z.number(),
  rank: z.string().optional(),
  wins: z.number(),
  losses: z.number(),
  hotStreak: z.boolean().optional(),
  veteran: z.boolean().optional(),
  freshBlood: z.boolean().optional(),
  inactive: z.boolean().optional(),
})

export const LeagueListSchema = z.object({
  tier: z.string(),
  queue: z.string().optional(),
  name: z.string().optional(),
  entries: z.array(LeagueItemSchema),
})

export type LeagueItem = z.infer<typeof LeagueItemSchema>
export type LeagueList = z.infer<typeof LeagueListSchema>
