import {
  getMatch,
  getMatchTimeline,
  type MatchDto,
  type MatchTimeline,
  type RiotApiClient,
  type RoutingRegion,
} from "@riftlens/riot-api"
import { withCache } from "@/lib/cache"

/**
 * Matches and their timelines are immutable once a game ends, so cache them for
 * a long time. One home for the TTL and key format keeps every read-through
 * (match detail, ladder season, live game, coaching) sharing the same entries.
 */
const IMMUTABLE_TTL = 2_592_000 // 30 days

/** Read-through cached `getMatch` (shared `match:` key across the app). */
export function cachedMatch(
  client: RiotApiClient,
  routing: RoutingRegion,
  matchId: string
): Promise<MatchDto> {
  return withCache(`match:${routing}:${matchId}`, IMMUTABLE_TTL, () =>
    getMatch(client, routing, matchId)
  )
}

/** Read-through cached `getMatchTimeline` (shared `tl:` key across the app). */
export function cachedTimeline(
  client: RiotApiClient,
  routing: RoutingRegion,
  matchId: string
): Promise<MatchTimeline> {
  return withCache(`tl:${routing}:${matchId}`, IMMUTABLE_TTL, () =>
    getMatchTimeline(client, routing, matchId)
  )
}
