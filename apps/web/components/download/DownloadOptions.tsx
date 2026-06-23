"use client"

import { Apple, Download, Monitor, Terminal } from "lucide-react"
import { useEffect, useState } from "react"
import { DESKTOP_RELEASES_URL, type DesktopOS, detectOS, OS_LABEL } from "@/lib/desktop"
import { useI18n } from "@/lib/i18n"

const ICON: Record<DesktopOS, typeof Monitor> = {
  windows: Monitor,
  mac: Apple,
  linux: Terminal,
}
const PLATFORMS: DesktopOS[] = ["windows", "mac", "linux"]

/** Premium-gated download UI (rendered only for premium users). */
export function DownloadOptions() {
  const { t } = useI18n()
  // "unknown" until mounted, so OS-specific UI renders client-side only.
  const [os, setOs] = useState<DesktopOS | null | "unknown">("unknown")

  useEffect(() => {
    setOs(detectOS())
  }, [])

  const PrimaryIcon = os && os !== "unknown" ? ICON[os] : Download

  return (
    <div className="space-y-8">
      {os !== "unknown" && (
        <div className="flex flex-col items-center gap-2">
          <a
            href={DESKTOP_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <PrimaryIcon className="h-5 w-5" />
            {os ? t("download.forOS", { os: OS_LABEL[os] }) : t("download.cta")}
          </a>
          <p className="text-xs text-muted-foreground">{t("download.note")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PLATFORMS.map((p) => {
          const Icon = ICON[p]
          return (
            <a
              key={p}
              href={DESKTOP_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-center transition-colors hover:bg-accent/40"
            >
              <Icon className="h-7 w-7 text-muted-foreground" />
              <span className="text-sm font-medium">{OS_LABEL[p]}</span>
              <span className="text-xs text-muted-foreground">{t("download.get")}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
