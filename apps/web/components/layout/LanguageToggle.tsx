"use client"

import { usePathname, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"

export function LanguageToggle() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const pathname = usePathname() ?? "/"

  function toggle() {
    // Swap the /fr prefix on the current URL (English lives at the root).
    const target =
      locale === "fr"
        ? pathname.replace(/^\/fr(?=\/|$)/, "") || "/"
        : pathname === "/"
          ? "/fr"
          : `/fr${pathname}`
    router.push(target)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold uppercase hover:bg-accent transition-colors"
      aria-label={t("nav.language")}
      title={t("nav.language")}
    >
      {locale === "fr" ? "FR" : "EN"}
    </button>
  )
}
