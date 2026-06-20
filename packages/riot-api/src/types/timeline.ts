import { z } from "zod"

export const TimelineEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  participantId: z.number().optional(),
  itemId: z.number().optional(),
  skillSlot: z.number().optional(), // 1=Q 2=W 3=E 4=R
  levelUpType: z.string().optional(),
})

export const MatchTimelineSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()), // puuids, index 0 = participantId 1
  }),
  info: z.object({
    frames: z.array(
      z.object({
        timestamp: z.number().optional(),
        events: z.array(TimelineEventSchema),
      })
    ),
  }),
})

export type MatchTimeline = z.infer<typeof MatchTimelineSchema>
export type TimelineEvent = z.infer<typeof TimelineEventSchema>
