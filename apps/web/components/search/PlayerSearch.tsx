"use client"

import { getProfileIconUrl } from "@riftlens/riot-api"
import { Clock, Search, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { localePath } from "@/lib/i18n/locale-path"
import { REGION_IDS, REGION_NAME_KEY, regionBadge } from "@/lib/regions"
import { tierLabel } from "@/lib/tiers"

const RECENT_KEY = "riftlens:recent"
const MAX_RECENT = 6

interface RecentSearch {
  gameName: string
  tagLine: string
  region: string
  profileIconId?: number | null | undefined
}

interface SoloRank {
  tier: string
  rank: string
  leaguePoints: number
}

interface Suggestion {
  gameName: string
  tagLine: string
  region: string
  profileIconId: number | null
  summonerLevel: number | null
  soloRank?: SoloRank | null
}

type Translate = ReturnType<typeof useI18n>["t"]

function formatRank(t: Translate, r: SoloRank): string {
  const tier = tierLabel(t, r.tier)
  const apex = r.tier === "MASTER" || r.tier === "GRANDMASTER" || r.tier === "CHALLENGER"
  const lp = t("history.lp", { value: r.leaguePoints })
  return apex ? `${tier} ${lp}` : `${tier} ${r.rank} · ${lp}`
}

function parseQuery(raw: string): { gameName: string; tagLine: string } | null {
  const trimmed = raw.trim()
  if (!trimmed.includes("#")) return null
  const idx = trimmed.indexOf("#")
  const gameName = trimmed.slice(0, idx)
  const tagLine = trimmed.slice(idx + 1).toUpperCase()
  if (!gameName || !tagLine) return null
  return { gameName, tagLine }
}

/**
 * The single player-search bar used across the site — the navbar (compact) and
 * the home hero (large) share it, so the experience is identical everywhere:
 * coloured region pill, ⌘K focus, recent searches, and live typeahead.
 */
export function PlayerSearch({ variant = "compact" }: { variant?: "compact" | "hero" }) {
  const hero = variant === "hero"
  const router = useRouter()
  const { t, locale } = useI18n()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("EUW1")
  const [regionOpen, setRegionOpen] = useState(false)
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null until mounted so the ⌘K/Ctrl K hint renders client-side only.
  const [isMac, setIsMac] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function loadRecent() {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      setRecent(stored ? (JSON.parse(stored) as RecentSearch[]) : [])
    } catch {}
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
  useEffect(() => loadRecent(), [])

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent))
  }, [])

  // Ctrl/Cmd+K focuses the input.
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

  // Live typeahead: validate a full Name#TAG via Riot, else search the local DB.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const hasTag = query.includes("#")
    const idx = query.indexOf("#")
    const namePart = hasTag ? query.slice(0, idx) : query
    const tagPart = hasTag ? query.slice(idx + 1) : ""

    if (namePart.trim().length < 2) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    debounceRef.current = setTimeout(async () => {
      try {
        if (hasTag && tagPart.length >= 2) {
          const res = await fetch(
            `/api/riot/profile-summary?gameName=${encodeURIComponent(namePart)}&tagLine=${encodeURIComponent(tagPart)}&region=${region}`
          )
          if (res.ok) {
            const p = (await res.json()) as Suggestion
            setSuggestions([{ ...p, region }])
          } else if (res.status === 404) {
            setSuggestions([])
            setError(t("search.notFound"))
          } else {
            setSuggestions([])
            setError(t("search.unavailable"))
          }
          return
        }
        const res = await fetch(`/api/search?q=${encodeURIComponent(namePart)}&region=${region}`)
        const data = (await res.json()) as Suggestion[]
        setSuggestions(data)
        if (data.length === 0) setError(t("search.noResult"))
      } catch {
        setSuggestions([])
        setError(t("search.networkError"))
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, region, t])

  function navigate(gameName: string, tagLine: string, reg: string, profileIconId?: number | null) {
    const next: RecentSearch = { gameName, tagLine, region: reg, profileIconId }
    const updated = [
      next,
      ...recent.filter((r) => r.gameName !== gameName || r.tagLine !== tagLine),
    ].slice(0, MAX_RECENT)
    setRecent(updated)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
    setQuery("")
    setSuggestions([])
    setSearchOpen(false)
    router.push(
      localePath(
        locale,
        `/profile/${reg}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
      )
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseQuery(query)
    if (parsed) {
      navigate(parsed.gameName, parsed.tagLine, region)
      return
    }
    const first = suggestions[0] ?? recent[0]
    if (first) navigate(first.gameName, first.tagLine, first.region)
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
  const showSuggestions =
    searchOpen && query.trim().length >= 2 && (suggestions.length > 0 || loading || error !== null)
  const showRecent = searchOpen && !query && recent.length > 0

  return (
    <div
      ref={searchRef}
      className={`relative flex items-center ${hero ? "w-full max-w-xl" : "flex-1 max-w-md"}`}
    >
      <form
        onSubmit={handleSubmit}
        className={`flex flex-1 items-center overflow-hidden border border-r-0 ${
          hero ? "rounded-l-xl shadow-sm" : "rounded-l-md"
        }`}
      >
        <div className="relative flex-1">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${
              hero ? "left-3 h-4 w-4" : "left-2.5 h-3.5 w-3.5"
            }`}
          />
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
            className={`w-full bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring placeholder:text-muted-foreground ${
              hero ? "h-12 pl-10 pr-4 text-base" : "h-9 pl-8 pr-12 text-sm"
            }`}
            autoComplete="off"
            spellCheck={false}
          />
          {!hero && isMac !== null && (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center rounded border px-1 text-[10px] text-muted-foreground pointer-events-none">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          )}
        </div>
      </form>

      {/* Dropdown: live suggestions, else recent searches. */}
      {(showSuggestions || showRecent) && (
        <div
          className={`absolute left-0 top-full mt-1 z-50 w-full overflow-hidden border bg-popover shadow-xl ${
            hero ? "rounded-xl" : "rounded-md"
          }`}
        >
          {showSuggestions &&
            (loading ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">{t("search.searching")}</div>
            ) : suggestions.length === 0 && error ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">{error}</div>
            ) : (
              suggestions.map((s) => (
                <button
                  key={`${s.gameName}#${s.tagLine}@${s.region}`}
                  type="button"
                  onClick={() => navigate(s.gameName, s.tagLine, s.region, s.profileIconId)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent"
                >
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                    {s.profileIconId != null ? (
                      // biome-ignore lint/performance/noImgElement: external CDN icon
                      <img
                        src={getProfileIconUrl(s.profileIconId)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">
                      <span className="font-medium">{s.gameName}</span>
                      <span className="text-muted-foreground">#{s.tagLine}</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {s.soloRank ? formatRank(t, s.soloRank) : t("profile.unranked")}
                      {s.summonerLevel ? ` · ${t("search.level", { n: s.summonerLevel })}` : ""}
                    </span>
                  </div>
                  <span
                    className="ml-auto flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: regionBadge(s.region).color }}
                  >
                    {regionBadge(s.region).label}
                  </span>
                </button>
              ))
            ))}

          {showRecent && (
            <>
              <p className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("search.recent")}
              </p>
              {recent.map((r, i) => (
                <div
                  key={`${r.gameName}#${r.tagLine}@${r.region}`}
                  className="group flex items-center px-4 py-2.5 hover:bg-accent"
                >
                  <button
                    type="button"
                    onClick={() => navigate(r.gameName, r.tagLine, r.region, r.profileIconId)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
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
                    <span className="truncate text-sm font-medium">{r.gameName}</span>
                    <span className="text-sm text-muted-foreground">#{r.tagLine}</span>
                    <span
                      className="ml-auto flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: regionBadge(r.region).color }}
                    >
                      {regionBadge(r.region).label}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("common.clear")}
                    onClick={(e) => removeRecent(i, e)}
                    className="ml-2 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Region pill + dropdown — kept OUTSIDE the form so it isn't clipped. */}
      <div ref={regionRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setRegionOpen((o) => !o)}
          className={`border border-l-0 font-semibold text-white ${
            hero ? "h-12 rounded-r-xl px-3 text-sm" : "h-9 rounded-r-md px-2.5 text-xs"
          }`}
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
  )
}
