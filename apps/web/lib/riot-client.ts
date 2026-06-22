import { RiotApiClient } from "@riftlens/riot-api"

/**
 * Build a Riot API client from the server-only key. Centralizes the env read so
 * routes don't sprinkle `process.env.RIOT_API_KEY!` non-null assertions.
 *
 * The key must never be exposed to the client — keep this import server-side.
 */
export function riotClient(): RiotApiClient {
  const key = process.env.RIOT_API_KEY
  if (!key) throw new Error("RIOT_API_KEY is not configured")
  return new RiotApiClient(key)
}
