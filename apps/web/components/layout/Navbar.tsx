"use client"

import { Download } from "lucide-react"
import { Link } from "@/components/Link"
import { PlayerSearch } from "@/components/search/PlayerSearch"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { LanguageToggle } from "./LanguageToggle"
import { ServerStatus } from "./ServerStatus"
import { ThemeToggle } from "./ThemeToggle"

const NAV_LINKS: { href: string; label: TranslationKey }[] = [
  { href: "/leaderboard", label: "leaderboard.title" },
  { href: "/live-games", label: "nav.liveGames" },
  { href: "/champions", label: "champions.title" },
  { href: "/items", label: "nav.items" },
  { href: "/runes", label: "nav.runes" },
  { href: "/patch-notes", label: "patch.title" },
]

export function Navbar() {
  const { t } = useI18n()

  return (
    <header className="flex h-14 items-center border-b px-4 gap-4">
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-[11px] font-bold text-primary-foreground">RL</span>
        </div>
        <span className="font-bold tracking-tight hidden sm:inline">RiftLens</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {t(l.label)}
          </Link>
        ))}
      </nav>

      <PlayerSearch variant="compact" />

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <ServerStatus />
        <LanguageToggle />
        <ThemeToggle />
        <Link
          href="/download"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-medium whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("nav.download")}</span>
        </Link>
        <Link
          href="/login"
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium whitespace-nowrap"
        >
          {t("nav.login")}
        </Link>
      </div>
    </header>
  )
}
