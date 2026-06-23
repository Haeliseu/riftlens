/** Where the desktop app builds are published (GitHub Releases by default). */
export const DESKTOP_RELEASES_URL =
  process.env.NEXT_PUBLIC_DESKTOP_RELEASES_URL ??
  "https://github.com/Haeliseu/riftlens/releases/latest"

export type DesktopOS = "windows" | "mac" | "linux"

/** Best-effort OS detection from the browser (client-side only). */
export function detectOS(): DesktopOS | null {
  if (typeof navigator === "undefined") return null
  const ua = `${navigator.platform} ${navigator.userAgent}`
  if (/Win/i.test(ua)) return "windows"
  if (/Mac|iPhone|iPad|iPod/i.test(ua)) return "mac"
  if (/Linux|Android|X11/i.test(ua)) return "linux"
  return null
}

export const OS_LABEL: Record<DesktopOS, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
}
