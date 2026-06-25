import { describe, expect, it } from "vitest"
import { patchLabel, patchNotesHubUrl, patchNotesUrl } from "@/lib/patches"

describe("patch helpers", () => {
  it("derives the marketing label (DDragon major + 10)", () => {
    expect(patchLabel("16.13.1")).toBe("26.13")
    expect(patchLabel("15.1.1")).toBe("25.1")
  })
  it("returns null for malformed versions", () => {
    expect(patchLabel("garbage")).toBeNull()
    expect(patchNotesUrl("nope", "en")).toBeNull()
  })
  it("builds the official article URL per locale", () => {
    expect(patchNotesUrl("16.13.1", "en")).toBe(
      "https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-13-notes"
    )
    expect(patchNotesUrl("16.13.1", "fr")).toBe(
      "https://www.leagueoflegends.com/fr-fr/news/game-updates/league-of-legends-patch-26-13-notes"
    )
  })
  it("builds the locale-aware hub URL", () => {
    expect(patchNotesHubUrl("fr")).toContain("/fr-fr/news/tags/patch-notes/")
    expect(patchNotesHubUrl("en")).toContain("/en-us/news/tags/patch-notes/")
  })
})
