import { describe, expect, it } from "vitest"
import {
  REGION_IDS,
  REGION_NAME_KEY,
  regionBadge,
  regionFromSlug,
  regionToSlug,
} from "@/lib/regions"

describe("region slugs", () => {
  it("round-trips every region id through its slug", () => {
    for (const id of REGION_IDS) {
      expect(regionFromSlug(regionToSlug(id))).toBe(id)
    }
  })
  it("accepts the friendly slug, the raw id, and is case-insensitive", () => {
    expect(regionFromSlug("na")).toBe("NA1")
    expect(regionFromSlug("na1")).toBe("NA1")
    expect(regionFromSlug("EUW")).toBe("EUW1")
    expect(regionFromSlug("kr")).toBe("KR")
  })
  it("returns null for an unknown slug", () => {
    expect(regionFromSlug("nope")).toBeNull()
  })
})

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
