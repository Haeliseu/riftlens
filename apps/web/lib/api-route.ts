import type { Region } from "@riftlens/riot-api"
import { type NextRequest, NextResponse } from "next/server"

/** Throw to short-circuit a route with a specific HTTP status. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

interface RouteResult {
  data: unknown
  /** Optional Cache-Control value (see CACHE). */
  cache?: string
}

/**
 * Wraps a JSON GET handler so every route shares one place for query-param
 * validation (throw HttpError) and error handling, instead of repeating the
 * same try/catch + NextResponse boilerplate in ~30 routes.
 */
export function jsonRoute<C = unknown>(
  handler: (req: NextRequest, ctx: C) => Promise<RouteResult>
) {
  return async (req: NextRequest, ctx: C): Promise<NextResponse> => {
    try {
      const { data, cache } = await handler(req, ctx)
      return NextResponse.json(data, cache ? { headers: { "Cache-Control": cache } } : undefined)
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      // Propagate the upstream status when present (e.g. Riot 404/429) so clients
      // see the real code; otherwise 500. Unifies the routes' error handling.
      const status = (err as { status?: number }).status ?? 500
      return NextResponse.json({ error: String(err) }, { status })
    }
  }
}

/** Read a required query param or fail with 400. */
export function requireParam(req: NextRequest, name: string): string {
  const value = req.nextUrl.searchParams.get(name)
  if (!value) throw new HttpError(400, `Missing ${name}`)
  return value
}

/** Read the `region` query param (defaults to EUW1, matching prior behavior). */
export function regionParam(req: NextRequest): Region {
  return (req.nextUrl.searchParams.get("region") ?? "EUW1") as Region
}

/** Shared Cache-Control presets used across the Riot proxy routes. */
export const CACHE = {
  short: "public, s-maxage=30, stale-while-revalidate=60",
  medium: "public, s-maxage=300, stale-while-revalidate=600",
  long: "public, s-maxage=3600, stale-while-revalidate=86400",
} as const
