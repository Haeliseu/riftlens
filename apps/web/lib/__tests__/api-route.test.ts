import type { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { CACHE, HttpError, jsonRoute, regionParam, requireParam } from "@/lib/api-route"

const req = (qs: string) =>
  ({ nextUrl: { searchParams: new URLSearchParams(qs) } }) as unknown as NextRequest

describe("requireParam / regionParam", () => {
  it("returns a present param", () => {
    expect(requireParam(req("puuid=abc"), "puuid")).toBe("abc")
  })
  it("throws HttpError(400) when a param is missing", () => {
    expect(() => requireParam(req(""), "puuid")).toThrow(HttpError)
    try {
      requireParam(req(""), "puuid")
    } catch (e) {
      expect((e as HttpError).status).toBe(400)
      expect((e as HttpError).message).toBe("Missing puuid")
    }
  })
  it("regionParam defaults to EUW1 and reads the query", () => {
    expect(regionParam(req(""))).toBe("EUW1")
    expect(regionParam(req("region=NA1"))).toBe("NA1")
  })
})

describe("jsonRoute", () => {
  it("returns data + Cache-Control on success", async () => {
    const handler = jsonRoute(async () => ({ data: { ok: 1 }, cache: CACHE.long }))
    const res = await handler(req(""), undefined)
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toBe(CACHE.long)
    expect(await res.json()).toEqual({ ok: 1 })
  })
  it("omits Cache-Control when no cache is returned", async () => {
    const handler = jsonRoute(async () => ({ data: { ok: 1 } }))
    const res = await handler(req(""), undefined)
    expect(res.headers.get("Cache-Control")).toBeNull()
  })
  it("maps HttpError to its status + message", async () => {
    const handler = jsonRoute(async () => {
      throw new HttpError(400, "Missing x")
    })
    const res = await handler(req(""), undefined)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Missing x" })
  })
  it("propagates an upstream status (e.g. a Riot 404)", async () => {
    const handler = jsonRoute(async () => {
      throw Object.assign(new Error("not found"), { status: 404 })
    })
    const res = await handler(req(""), undefined)
    expect(res.status).toBe(404)
  })
  it("defaults to 500 for an error without a status", async () => {
    const handler = jsonRoute(async () => {
      throw new Error("boom")
    })
    const res = await handler(req(""), undefined)
    expect(res.status).toBe(500)
  })
})
