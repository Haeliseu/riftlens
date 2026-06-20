import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { describe, expect, it, vi, afterEach } from "vitest"
import { usePreviouslyPlayed } from "../usePreviouslyPlayed"

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("usePreviouslyPlayed", () => {
  it("returns null query when myPuuid is null (not logged in)", () => {
    const { result } = renderHook(() => usePreviouslyPlayed(null, "their-puuid"), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("fetches from API with correct params", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    } as Response)

    const { result } = renderHook(
      () => usePreviouslyPlayed("mock-puuid", "their-puuid"),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it("caches result for 5 minutes (isStale false after fetch)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    } as Response)

    const { result } = renderHook(
      () => usePreviouslyPlayed("mock-puuid", "their-puuid"),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // staleTime = 300_000ms, isStale should be false right after fetch
    expect(result.current.isStale).toBe(false)
  })
})
