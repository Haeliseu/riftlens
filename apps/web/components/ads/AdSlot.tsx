"use client"

import { useEffect, useRef } from "react"
import { AD_SLOTS, ADSENSE_CLIENT, type AdSlotId, adsEnabled } from "@/lib/ads"

interface AdSlotProps {
  /** Which configured placement to render. */
  placement: AdSlotId
  /** AdSense ad format (default responsive "auto"). */
  format?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * A single AdSense ad unit. Renders nothing unless ads are enabled AND this
 * placement has a slot id, so there's never an empty frame when ads are off.
 * Unfilled units (no ad to show) are collapsed via CSS in globals.css.
 */
export function AdSlot({ placement, format = "auto", className, style }: AdSlotProps) {
  const slot = AD_SLOTS[placement]
  const pushed = useRef(false)

  useEffect(() => {
    if (!adsEnabled || !slot || pushed.current) return
    try {
      // biome-ignore lint/suspicious/noExplicitAny: adsbygoogle is injected by Google's script
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not ready / blocked — leave the slot collapsed.
    }
  }, [slot])

  if (!adsEnabled || !slot) return null

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
