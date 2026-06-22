import { describe, expect, it } from "vitest"
import { REGION_IDS, REGION_NAME_KEY, regionBadge } from "@/lib/regions"

describe("regionBadge", () => {
  it("returns label + colour for a known region", () => {
    const na = regionBadge("NA1")
    expect(na.label).toBe("NA")
    expect(na.color).toMatch(/^#/)
  })

  it("falls back to the raw id for an unknown region", () => {
    expect(regionBadge("ZZ9").label).toBe("ZZ9")
  })

  it("has a name key for every selectable region", () => {
    for (const id of REGION_IDS) {
      expect(REGION_NAME_KEY[id]).toBeDefined()
    }
  })
})
