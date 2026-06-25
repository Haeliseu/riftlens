import type { ZodType } from "zod"
import { RiotApiError } from "./errors"
import { defaultRateLimiter, type RateLimiter } from "./rate-limit"
import { withRetry } from "./retry"

export type Region =
  | "EUW1"
  | "EUN1"
  | "NA1"
  | "KR"
  | "BR1"
  | "LA1"
  | "LA2"
  | "OC1"
  | "TR1"
  | "RU"
  | "JP1"
  | "PH2"
  | "SG2"
  | "TH2"
  | "TW2"
  | "VN2"
export type RoutingRegion = "europe" | "americas" | "asia" | "sea"

const REGION_TO_ROUTING: Record<Region, RoutingRegion> = {
  EUW1: "europe",
  EUN1: "europe",
  TR1: "europe",
  RU: "europe",
  NA1: "americas",
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  KR: "asia",
  JP1: "asia",
  OC1: "sea",
  PH2: "sea",
  SG2: "sea",
  TH2: "sea",
  TW2: "sea",
  VN2: "sea",
}

/** Maps a platform region (EUW1, NA1, KR, …) to its regional routing cluster. */
export function regionToRouting(region: string): RoutingRegion {
  return REGION_TO_ROUTING[region as Region] ?? "europe"
}

export class RiotApiClient {
  private readonly apiKey: string
  private readonly limiter: RateLimiter

  constructor(apiKey: string, limiter: RateLimiter = defaultRateLimiter) {
    this.apiKey = apiKey
    this.limiter = limiter
  }

  getRoutingRegion(region: Region): RoutingRegion {
    return REGION_TO_ROUTING[region]
  }

  async fetch<T>(url: string, schema: ZodType<T>): Promise<T> {
    return this.limiter.schedule(() =>
      withRetry(async () => {
        const res = await fetch(url, {
          headers: { "X-Riot-Token": this.apiKey },
        })
        if (!res.ok) {
          const retryAfterHeader = res.headers.get("Retry-After")
          const err = new RiotApiError(res.status, url, await res.text())
          err.retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null
          throw err
        }
        return schema.parse(await res.json())
      })
    )
  }
}
