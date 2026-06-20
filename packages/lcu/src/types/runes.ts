import { z } from "zod"

export const RunePageSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  primaryStyleId: z.number(),
  subStyleId: z.number(),
  selectedPerkIds: z.array(z.number()),
  current: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isEditable: z.boolean().optional(),
  isRecommendationOverride: z.boolean().optional(),
  isValid: z.boolean().optional(),
  order: z.number().optional(),
})

export const RunePageListSchema = z.array(RunePageSchema)

export type LcuRunePage = z.infer<typeof RunePageSchema>
