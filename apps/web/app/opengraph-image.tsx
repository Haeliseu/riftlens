import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/seo"

export const alt = `${siteConfig.name} — LoL Tracker`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1130 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2 }}>{siteConfig.name}</div>
      <div style={{ fontSize: 40, color: "#a78bfa", marginTop: 8 }}>League of Legends Tracker</div>
      <div style={{ fontSize: 28, color: "#9ca3af", marginTop: 32 }}>
        Profils · Classement · Coaching · Live Game
      </div>
    </div>,
    { ...size }
  )
}
