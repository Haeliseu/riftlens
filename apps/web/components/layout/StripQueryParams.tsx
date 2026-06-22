"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Dashboard routes never use query params (filtering is component state only).
 * If a stale `?…` lingers in the URL (old bookmark / previous version), strip it
 * so the address bar stays clean.
 */
export function StripQueryParams() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      router.replace(pathname)
    }
  }, [pathname, router])

  return null
}
