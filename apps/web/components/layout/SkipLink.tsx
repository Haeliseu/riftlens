"use client"

import { useI18n } from "@/lib/i18n"

/** RGAA 12.7 — keyboard "skip to content" link, visible only on focus. */
export function SkipLink() {
  const { t } = useI18n()
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
    >
      {t("a11y.skipToContent")}
    </a>
  )
}
