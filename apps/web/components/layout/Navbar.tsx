"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { regionBadge } from "@/lib/regions"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"

const REGIONS = ["EUW1", "EUN1", "NA1", "KR", "BR1", "JP1", "OC1", "TR1", "LA1", "LA2", "RU"]

const NAV_LINKS: { href: string; label: TranslationKey }[] = [
  { href: "/leaderboard", label: "leaderboard.title" },
  { href: "/champions", label: "champions.title" },
]

export function Navbar() {
  const router = useRouter()
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("EUW1")
  const [regionOpen, setRegionOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  // Ctrl/Cmd+K focuses the search input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Close the region dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const sep = trimmed.includes("#") ? "#" : " "
    const parts = trimmed.split(sep)
    if (parts.length < 2) return
    const gameName = parts[0] ?? ""
    const tagLine = parts.slice(1).join("").toUpperCase()
    if (!gameName || !tagLine) return
    router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${tagLine}`)
    setQuery("")
  }

  const badge = regionBadge(region)

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

      <div className="flex flex-1 items-center max-w-md">
        <form
          onSubmit={handleSearch}
          className="flex flex-1 items-center rounded-l-md border border-r-0 overflow-hidden"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t("nav.search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full bg-transparent pl-8 pr-12 text-sm focus:outline-none placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center rounded border px-1 text-[10px] text-muted-foreground pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Region pill (same colours as profile region badges) + dropdown.
            Kept OUTSIDE the form so the dropdown isn't clipped by overflow. */}
        <div ref={regionRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setRegionOpen((o) => !o)}
            className="h-9 rounded-r-md border border-l-0 px-2.5 text-xs font-semibold text-white"
            style={{ backgroundColor: badge.color }}
          >
            {badge.label}
          </button>
          {regionOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 flex flex-wrap justify-end gap-1.5 rounded-md border bg-popover p-2 shadow-xl w-40">
              {REGIONS.map((id) => {
                const b = regionBadge(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setRegion(id)
                      setRegionOpen(false)
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${
                      id === region ? "ring-1 ring-foreground" : ""
                    }`}
                    style={{ backgroundColor: b.color }}
                  >
                    {b.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <LanguageToggle />
        <ThemeToggle />
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
