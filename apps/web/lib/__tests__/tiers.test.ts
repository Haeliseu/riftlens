import { describe, expect, it } from "vitest"
import { capitalizeTier, rankLabel, tierColor, tierLabel } from "@/lib/tiers"

// Minimal translator stub (returns the key) for the locale-aware helpers.
const t = ((key: string) => key) as Parameters<typeof rankLabel>[0]

describe("tiers", () => {
  it("capitalizeTier normalises Riot's UPPERCASE tier", () => {
    expect(capitalizeTier("DIAMOND")).toBe("Diamond")
    expect(capitalizeTier("CHALLENGER")).toBe("Challenger")
  })

  it("tierColor returns a colour for a known tier and a fallback otherwise", () => {
    expect(tierColor("GOLD")).toMatch(/^#/)
    expect(tierColor("NOPE")).toBe("#888")
  })

  it("rankLabel keeps the division for non-apex tiers", () => {
    expect(rankLabel(t, "DIAMOND", "III")).toBe("tier.diamond III")
  })

  it("rankLabel drops the division for apex tiers", () => {
    expect(rankLabel(t, "MASTER", "I")).toBe("tier.master")
    expect(rankLabel(t, "CHALLENGER", "I")).toBe("tier.challenger")
  })

  it("tierLabel returns the bare localized tier", () => {
    expect(tierLabel(t, "EMERALD")).toBe("tier.emerald")
  })
})
