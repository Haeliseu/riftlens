import type { MatchDetailParticipant } from "@/hooks/useMatchDetail"

export function carryColor(score: number): string {
  if (score >= 65) return "text-violet-400"
  if (score >= 45) return "text-blue-400"
  if (score >= 30) return "text-muted-foreground"
  return "text-red-400"
}

export function placementLabel(p: number): string {
  return p === 1 ? "1st" : p === 2 ? "2nd" : p === 3 ? "3rd" : `${p}th`
}

export function diffColor(v: number): string {
  return v > 0 ? "text-green-500" : v < 0 ? "text-red-500" : "text-muted-foreground"
}

export const SKILL_LABEL = ["", "Q", "W", "E", "R"]
export const SKILL_COLOR: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-blue-500", text: "text-blue-400" },
  2: { bg: "bg-amber-500", text: "text-amber-400" },
  3: { bg: "bg-violet-500", text: "text-violet-400" },
  4: { bg: "bg-red-500", text: "text-red-400" },
}

export function Icon({
  src,
  size = 20,
  alt = "",
}: {
  src: string | null
  size?: number
  alt?: string
}) {
  if (!src) {
    return (
      <span
        className="inline-block rounded bg-muted"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }
  // biome-ignore lint/performance/noImgElement: external CDN icon
  return <img src={src} alt={alt} width={size} height={size} className="rounded" />
}

export function playerHref(region: string, p: MatchDetailParticipant) {
  return `/profile/${region}/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`
}
