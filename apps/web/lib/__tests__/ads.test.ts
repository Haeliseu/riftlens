import { describe, expect, it } from "vitest"
import { AD_SLOTS, ADSENSE_CLIENT, adsEnabled } from "@/lib/ads"

// No NEXT_PUBLIC_ADSENSE_* env in tests → ads are fully off.
describe("ads config (off by default)", () => {
  it("has no publisher id and is disabled", () => {
    expect(ADSENSE_CLIENT).toBe("")
    expect(adsEnabled).toBe(false)
  })
  it("every placement slot is empty when unconfigured", () => {
    for (const slot of Object.values(AD_SLOTS)) {
      expect(slot).toBe("")
    }
  })
})
