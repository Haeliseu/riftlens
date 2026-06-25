import Script from "next/script"
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads"

/**
 * Loads the AdSense library — only when a publisher id is configured, so the
 * site ships zero ad code (and no requests to Google) when ads are off.
 */
export function AdSenseScript() {
  if (!adsEnabled) return null
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  )
}
