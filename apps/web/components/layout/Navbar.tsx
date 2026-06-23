"use client"

import { getProfileIconUrl } from "@riftlens/riot-api"
import { Clock, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Link } from "@/components/Link"
import { useI18n } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/dictionaries"
import { localePath } from "@/lib/i18n/locale-path"
import { REGION_IDS, REGION_NAME_KEY, regionBadge } from "@/lib/regions"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"

const NAV_LINKS: { href: string; label: TranslationKey }[] = [
  { href: "/leaderboard", label: "leaderboard.title" },
  { href: "/champions", label: "champions.title" },
  { href: "/download", label: "nav.download" },
]

const RECENT_KEY = "riftlens:recent"
const MAX_RECENT = 6

interface RecentSearch {
  gameName: string
  tagLine: string
  region: string
  profileIconId?: number | null
}

export function Navbar() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("EUW1")
  const [regionOpen, setRegionOpen] = useState(false)
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  // null until mounted, so the shortcut hint renders only client-side (no SSR
  // hydration mismatch) with the key matching the user's OS.
  const [isMac, setIsMac] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Load recent searches (shared with the home search + profile visits).
  function loadRecent() {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      setRecent(stored ? (JSON.parse(stored) as RecentSearch[]) : [])
    } catch {}
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
  useEffect(() => loadRecent(), [])

  // Detect the platform once mounted to show the right modifier key.
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent))
  }, [])

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

  // Close dropdowns on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function navigate(gameName: string, tagLine: string, reg: string) {
    const next: RecentSearch = { gameName, tagLine, region: reg }
    const updated = [
      next,
      ...recent.filter((r) => r.gameName !== gameName || r.tagLine !== tagLine),
    ].slice(0, MAX_RECENT)
    setRecent(updated)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
    setQuery("")
    setSearchOpen(false)
    router.push(
      localePath(
        locale,
        `/profile/${reg}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
      )
    )
  }

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
    navigate(gameName, tagLine, region)
  }

  function removeRecent(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = recent.filter((_, i) => i !== idx)
    setRecent(updated)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
  }

  const badge = regionBadge(region)
  const showRecent = searchOpen && !query && recent.length > 0

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

      <div ref={searchRef} className="relative flex flex-1 items-center max-w-md">
        <form
          onSubmit={handleSearch}
          className="flex flex-1 items-center rounded-l-md border border-r-0 overflow-hidden"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              aria-label={t("nav.search.placeholder")}
              placeholder={t("nav.search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                loadRecent()
                setSearchOpen(true)
              }}
              className="h-9 w-full bg-transparent pl-8 pr-12 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            {isMac !== null && (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center rounded border px-1 text-[10px] text-muted-foreground pointer-events-none">
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            )}
          </div>
        </form>

        {/* Recent searches dropdown */}
        {showRecent && (
          <div className="absolute left-0 top-full mt-1 z-50 w-full rounded-md border bg-popover shadow-xl overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("search.recent")}
            </p>
            {recent.map((r, i) => (
              <div
                key={`${r.gameName}#${r.tagLine}@${r.region}`}
                className="flex items-center px-3 py-2 hover:bg-accent group"
              >
                <button
                  type="button"
                  onClick={() => navigate(r.gameName, r.tagLine, r.region)}
                  className="flex flex-1 items-center gap-2 text-left min-w-0"
                >
                  <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-muted flex items-center justify-center">
                    {r.profileIconId != null ? (
                      // biome-ignore lint/performance/noImgElement: external CDN icon
                      <img
                        src={getProfileIconUrl(r.profileIconId)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{r.gameName}</span>
                  <span className="text-sm text-muted-foreground">#{r.tagLine}</span>
                  <span
                    className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: regionBadge(r.region).color }}
                  >
                    {regionBadge(r.region).label}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t("common.clear")}
                  onClick={(e) => removeRecent(i, e)}
                  className="ml-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

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
            <div className="absolute right-0 top-full mt-1 z-50 max-h-80 w-56 overflow-y-auto rounded-md border bg-popover p-1 shadow-xl">
              <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("nav.region")}
              </p>
              {REGION_IDS.map((id) => {
                const b = regionBadge(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setRegion(id)
                      setRegionOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${
                      id === region ? "bg-accent" : ""
                    }`}
                  >
                    <span
                      className="inline-flex w-11 flex-shrink-0 justify-center rounded px-1 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: b.color }}
                    >
                      {b.label}
                    </span>
                    <span className="truncate">{t(REGION_NAME_KEY[id] ?? "nav.region")}</span>
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
