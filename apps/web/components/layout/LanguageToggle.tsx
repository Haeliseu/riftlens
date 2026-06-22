"use client"

import { useI18n } from "@/lib/i18n"

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
      className="flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold uppercase hover:bg-accent transition-colors"
      aria-label={t("nav.language")}
      title={t("nav.language")}
    >
      {locale === "fr" ? "FR" : "EN"}
    </button>
  )
}
