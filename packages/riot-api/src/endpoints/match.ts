import type { RiotApiClient, RoutingRegion } from "../client"
import { type MatchDto, MatchDtoSchema, MatchListSchema } from "../types/match"
import { type MatchTimeline, MatchTimelineSchema } from "../types/timeline"

export async function getMatchIds(
  client: RiotApiClient,
  routing: RoutingRegion,
  puuid: string,
  options: {
    queue?: number
    type?: string
    start?: number
    count?: number
    startTime?: number
    endTime?: number
  } = {}
): Promise<string[]> {
  const params = new URLSearchParams()
  if (options.queue !== undefined) params.set("queue", String(options.queue))
  if (options.type) params.set("type", options.type)
  if (options.start !== undefined) params.set("start", String(options.start))
  if (options.count !== undefined) params.set("count", String(options.count))
  if (options.startTime !== undefined)
    params.set("startTime", String(Math.floor(options.startTime / 1000)))
  if (options.endTime !== undefined)
    params.set("endTime", String(Math.floor(options.endTime / 1000)))

  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`
  return client.fetch(url, MatchListSchema)
}

export async function getMatch(
  client: RiotApiClient,
  routing: RoutingRegion,
  matchId: string
): Promise<MatchDto> {
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`
  return client.fetch(url, MatchDtoSchema)
}

export async function getMatchTimeline(
  client: RiotApiClient,
  routing: RoutingRegion,
  matchId: string
): Promise<MatchTimeline> {
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`
  return client.fetch(url, MatchTimelineSchema)
}
