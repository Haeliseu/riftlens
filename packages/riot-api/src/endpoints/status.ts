import { z } from "zod"
import type { Region, RiotApiClient } from "../client"

// lol-status-v4 platform-data. Entry subfields vary, so we keep it permissive
// and let the caller pick what it needs (titles, severity, timestamps).
const StatusSchema = z
  .object({
    maintenances: z.array(z.unknown()).default([]),
    incidents: z.array(z.unknown()).default([]),
  })
  .passthrough()

export type PlatformStatus = z.infer<typeof StatusSchema>

export async function getPlatformStatus(
  client: RiotApiClient,
  region: Region
): Promise<PlatformStatus> {
  const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/status/v4/platform-data`
  return client.fetch(url, StatusSchema)
}
