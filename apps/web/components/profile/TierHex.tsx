import type { TierName } from "@riftlens/riot-api"

export const TIER_COLOR: Record<string, string> = {
  IRON: "#888",
  BRONZE: "#c07840",
  SILVER: "#94a3b8",
  GOLD: "#EF9F27",
  PLATINUM: "#1D9E75",
  EMERALD: "#639922",
  DIAMOND: "#378ADD",
  MASTER: "#8a6ddd",
  GRANDMASTER: "#D85A30",
  CHALLENGER: "#f0c840",
}

/** Tier color from an UPPERCASE Riot tier (e.g. "DIAMOND") or capitalized TierName. */
export function tierColor(tier: string): string {
  return TIER_COLOR[tier.toUpperCase()] ?? "#888"
}

function hexPoints(h: number, r: number): string {
  return [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 2
      return `${(h + r * Math.cos(a)).toFixed(1)},${(h + r * Math.sin(a)).toFixed(1)}`
    })
    .join(" ")
}

interface TierHexProps {
  tier: string | TierName
  size?: number
}

/** Nested-hexagon rank emblem matching the RiftLens design mockups. */
export function TierHex({ tier, size = 28 }: TierHexProps) {
  const c = tierColor(tier)
  const h = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <polygon points={hexPoints(h, h * 0.88)} fill={c} opacity={0.9} />
      <polygon points={hexPoints(h, h * 0.55)} fill={c} opacity={0.2} />
      <polygon points={hexPoints(h, h * 0.28)} fill={c} opacity={0.45} />
    </svg>
  )
}
