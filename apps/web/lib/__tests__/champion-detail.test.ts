import { describe, expect, it } from "vitest"
import { championSplashUrl, cleanText, spellIconUrl } from "@/lib/champion-detail"

describe("cleanText", () => {
  it("turns <br> into newlines and strips other tags", () => {
    expect(cleanText("Deals <physicalDamage>50 damage</physicalDamage>.<br>Then heals.")).toBe(
      "Deals 50 damage.\nThen heals."
    )
  })
  it("decodes basic entities and trims", () => {
    expect(cleanText("  A &amp; B&nbsp;C  ")).toBe("A & B C")
  })
})

describe("ddragon image urls", () => {
  it("builds spell + splash urls", () => {
    expect(spellIconUrl("16.13.1", "AatroxQ.png")).toBe(
      "https://ddragon.leagueoflegends.com/cdn/16.13.1/img/spell/AatroxQ.png"
    )
    expect(championSplashUrl("Aatrox")).toBe(
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg"
    )
  })
})
