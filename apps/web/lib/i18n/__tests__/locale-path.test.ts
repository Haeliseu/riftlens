import { describe, expect, it } from "vitest"
import { localeAlternates, localePath } from "@/lib/i18n/locale-path"

describe("localePath", () => {
  it("keeps the default locale (en) at the root", () => {
    expect(localePath("en", "/")).toBe("/")
    expect(localePath("en", "/leaderboard")).toBe("/leaderboard")
  })
  it("prefixes non-default locales", () => {
    expect(localePath("fr", "/")).toBe("/fr")
    expect(localePath("fr", "/leaderboard")).toBe("/fr/leaderboard")
  })
  it("leaves non-internal hrefs untouched", () => {
    expect(localePath("fr", "https://example.com")).toBe("https://example.com")
    expect(localePath("fr", "#anchor")).toBe("#anchor")
  })
})

describe("localeAlternates", () => {
  it("builds canonical + hreflang languages for fr", () => {
    expect(localeAlternates("fr", "/x")).toEqual({
      canonical: "/fr/x",
      languages: { en: "/x", fr: "/fr/x", "x-default": "/x" },
    })
  })
  it("uses the unprefixed canonical for en", () => {
    expect(localeAlternates("en", "/x").canonical).toBe("/x")
  })
})
