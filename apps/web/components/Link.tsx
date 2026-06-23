"use client"

import NextLink from "next/link"
import type { ComponentProps } from "react"
import { useI18n } from "@/lib/i18n"
import { localePath } from "@/lib/i18n/locale-path"

/**
 * Locale-aware Link: internal hrefs are automatically prefixed with the active
 * locale (English stays at the root, French under /fr) so navigation keeps the
 * current language. Drop-in replacement for next/link.
 */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n()
  const resolved = typeof href === "string" ? localePath(locale, href) : href
  return <NextLink href={resolved} {...props} />
}
