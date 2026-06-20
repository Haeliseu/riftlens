import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { LcuClient } from "../client"

const CREDS = { port: 54321, password: "secret", protocol: "https" as const }

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  } as Response)
}

afterEach(() => vi.restoreAllMocks())

describe("LcuClient", () => {
  it("GET sends correct Authorization header", async () => {
    const spy = mockFetch({ id: 1, name: "Faker" })
    const client = new LcuClient(CREDS)
    const schema = z.object({ id: z.number(), name: z.string() })
    await client.get("/lol-summoner/v1/current-summoner", schema)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://127.0.0.1:54321/lol-summoner/v1/current-summoner")
    expect((init.headers as Record<string, string>)["Authorization"]).toMatch(/^Basic /)
  })

  it("GET validates and returns parsed response", async () => {
    mockFetch({ id: 42, name: "Test" })
    const client = new LcuClient(CREDS)
    const result = await client.get("/path", z.object({ id: z.number(), name: z.string() }))
    expect(result).toEqual({ id: 42, name: "Test" })
  })

  it("GET throws on non-ok response", async () => {
    mockFetch({}, false, 404)
    const client = new LcuClient(CREDS)
    await expect(client.get("/path", z.object({}))).rejects.toThrow("404")
  })

  it("POST sends body as JSON with correct headers", async () => {
    const spy = mockFetch({ success: true })
    const client = new LcuClient(CREDS)
    await client.post(
      "/lol-item-sets/v1/item-sets/123/sets",
      { name: "runes" },
      z.object({ success: z.boolean() })
    )
    const [, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe("POST")
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
    expect(JSON.parse(init.body as string)).toEqual({ name: "runes" })
  })

  it("POST throws on non-ok response", async () => {
    mockFetch({}, false, 500)
    const client = new LcuClient(CREDS)
    await expect(client.post("/path", {}, z.object({}))).rejects.toThrow("500")
  })

  it("DELETE sends DELETE method", async () => {
    const spy = mockFetch(null)
    const client = new LcuClient(CREDS)
    await client.delete("/lol-champ-select/v1/session/my-selection/runes")
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe("DELETE")
    expect(url).toContain("/lol-champ-select")
  })

  it("DELETE throws on non-ok response", async () => {
    mockFetch(null, false, 403)
    const client = new LcuClient(CREDS)
    await expect(client.delete("/path")).rejects.toThrow("403")
  })
})
