import { afterEach, describe, expect, it, vi } from "vitest"
import { detectOS, OS_LABEL } from "@/lib/desktop"

function stubNavigator(platform: string, userAgent: string) {
  vi.stubGlobal("navigator", { platform, userAgent })
}

describe("detectOS", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("detects Windows", () => {
    stubNavigator("Win32", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    expect(detectOS()).toBe("windows")
  })
  it("detects macOS", () => {
    stubNavigator("MacIntel", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)")
    expect(detectOS()).toBe("mac")
  })
  it("detects Linux", () => {
    stubNavigator("Linux x86_64", "Mozilla/5.0 (X11; Linux x86_64)")
    expect(detectOS()).toBe("linux")
  })
  it("returns null for an unknown platform", () => {
    stubNavigator("", "SomethingWeird/1.0")
    expect(detectOS()).toBeNull()
  })
})

describe("OS_LABEL", () => {
  it("maps each OS to a display label", () => {
    expect(OS_LABEL).toEqual({ windows: "Windows", mac: "macOS", linux: "Linux" })
  })
})
