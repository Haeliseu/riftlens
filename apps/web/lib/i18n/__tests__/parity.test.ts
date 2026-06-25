import { describe, expect, it } from "vitest"
import { en } from "@/lib/i18n/locales/en"
import { fr } from "@/lib/i18n/locales/fr"

describe("i18n key parity", () => {
  it("fr and en expose the exact same set of keys", () => {
    const frKeys = new Set(Object.keys(fr))
    const enKeys = new Set(Object.keys(en))

    const missingInEn = [...frKeys].filter((k) => !enKeys.has(k))
    const missingInFr = [...enKeys].filter((k) => !frKeys.has(k))

    expect(missingInEn).toEqual([])
    expect(missingInFr).toEqual([])
  })
})
