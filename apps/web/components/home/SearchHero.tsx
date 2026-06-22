"use client"

import { Clock, Search, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { tierLabel } from "@/lib/tiers"

export const REGIONS = [
  { id: "EUW1", label: "EUW" },
  { id: "NA1", label: "NA" },
  { id: "KR", label: "KR" },
  { id: "EUN1", label: "EUNE" },
  { id: "BR1", label: "BR" },
  { id: "JP1", label: "JP" },
  { id: "OC1", label: "OCE" },
  { id: "TR1", label: "TR" },
  { id: "LA1", label: "LAN" },
  { id: "LA2", label: "LAS" },
]

const STORAGE_KEY = "riftlens:recent"
const MAX_RECENT = 5

interface RecentSearch {
  gameName: string
  tagLine: string
  region: string
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

function profileIconUrl(id: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${id}.jpg`
}

function parseQuery(raw: string): { gameName: string; tagLine: string } | null {
  const trimmed = raw.trim()
  const sep = trimmed.includes("#") ? "#" : null
  if (!sep) return null
  const idx = trimmed.indexOf("#")
  const gameName = trimmed.slice(0, idx)
  const tagLine = trimmed.slice(idx + 1).toUpperCase()
  if (!gameName || !tagLine) return null
  return { gameName, tagLine }
}

function regionLabel(id: string) {
  return REGIONS.find((r) => r.id === id)?.label ?? id
}

export function SearchHero() {
  const router = useRouter()
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("EUW1")
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecent(JSON.parse(stored) as RecentSearch[])
    } catch {}
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const hasTag = query.includes("#")
    const idx = query.indexOf("#")
    const namePart = hasTag ? query.slice(0, idx) : query
    const tagPart = hasTag ? query.slice(idx + 1) : ""

    if (namePart.length < 2) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    debounceRef.current = setTimeout(async () => {
      try {
        // If full Name#TAG typed, validate + enrich directly via Riot API
        if (hasTag && tagPart.length >= 2) {
          const res = await fetch(
            `/api/riot/profile-summary?gameName=${encodeURIComponent(namePart)}&tagLine=${encodeURIComponent(tagPart)}&region=${region}`
          )
          if (res.ok) {
            const p = (await res.json()) as {
              gameName: string
              tagLine: string
              profileIconId: number | null
              summonerLevel: number | null
              soloRank: SoloRank | null
            }
            setSuggestions([
              {
                gameName: p.gameName,
                tagLine: p.tagLine,
                region,
                profileIconId: p.profileIconId,
                summonerLevel: p.summonerLevel,
                soloRank: p.soloRank,
              },
            ])
          } else if (res.status === 404) {
            setSuggestions([])
            setError(t("search.notFound"))
          } else {
            setSuggestions([])
            setError(t("search.unavailable"))
          }
          return
        }

        // Otherwise search local DB
        const res = await fetch(`/api/search?q=${encodeURIComponent(namePart)}&region=${region}`)
        const data = (await res.json()) as Suggestion[]
        setSuggestions(data)
        if (data.length === 0) {
          setError(t("search.noResult"))
        }
      } catch {
        setSuggestions([])
        setError(t("search.networkError"))
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, region, t])

  function navigate(gameName: string, tagLine: string, reg: string) {
    const next: RecentSearch = { gameName, tagLine, region: reg }
    const updated = [
      next,
      ...recent.filter((r) => r.gameName !== gameName || r.tagLine !== tagLine),
    ].slice(0, MAX_RECENT)
    setRecent(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
    setOpen(false)
    setQuery("")
    setSuggestions([])
    router.push(`/profile/${reg}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseQuery(query)
    if (parsed) {
      navigate(parsed.gameName, parsed.tagLine, region)
      return
    }
    // No tag typed — navigate to first suggestion or do nothing
    const first = suggestions[0] ?? recent[0]
    if (first) navigate(first.gameName, first.tagLine, first.region)
  }

  function removeRecent(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = recent.filter((_, i) => i !== idx)
    setRecent(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  const showRecent = open && !query && recent.length > 0
  const showSuggestions =
    open && query.length >= 2 && (suggestions.length > 0 || loading || error !== null)

  return (
    <div ref={ref} className="w-full max-w-xl relative">
      <form
        onSubmit={handleSubmit}
        className="flex rounded-xl border bg-card shadow-lg overflow-hidden"
      >
        {/* Region selector */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-muted border-r text-sm font-medium px-3 focus:outline-none cursor-pointer text-foreground flex-shrink-0"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-12 w-full bg-transparent pl-9 pr-4 text-sm focus:outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          className="px-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          {t("home.search.button")}
        </button>
      </form>

      {/* Dropdown */}
      {(showRecent || showSuggestions) && (
        <div className="absolute top-full mt-1 w-full rounded-xl border bg-card shadow-xl z-50 overflow-hidden">
          {/* Live suggestions */}
          {showSuggestions && (
            <>
              {loading ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  {t("search.searching")}
                </div>
              ) : suggestions.length === 0 && error ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">{error}</div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={`${s.gameName}#${s.tagLine}@${s.region}`}
                    type="button"
                    onClick={() => navigate(s.gameName, s.tagLine, s.region)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {s.profileIconId != null ? (
                        // biome-ignore lint/performance/noImgElement: external CDN icon, no domain config needed
                        <img
                          src={profileIconUrl(s.profileIconId)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate">
                        <span className="font-medium">{s.gameName}</span>
                        <span className="text-muted-foreground">#{s.tagLine}</span>
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {s.soloRank ? formatRank(t, s.soloRank) : t("profile.unranked")}
                        {s.summonerLevel ? ` · ${t("search.level", { n: s.summonerLevel })}` : ""}
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                      {regionLabel(s.region)}
                    </span>
                  </button>
                ))
              )}
            </>
          )}

          {/* Recent searches */}
          {showRecent && (
            <>
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("search.recent")}
              </p>
              {recent.map((r, i) => (
                <div
                  key={`${r.gameName}#${r.tagLine}`}
                  className="flex items-center px-4 py-2.5 hover:bg-accent transition-colors group"
                >
                  <button
                    type="button"
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => navigate(r.gameName, r.tagLine, r.region)}
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium">{r.gameName}</span>
                    <span className="text-muted-foreground text-sm">#{r.tagLine}</span>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {regionLabel(r.region)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => removeRecent(i, e)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
