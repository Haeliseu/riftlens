"use client"

import { Clock, Search, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

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

interface Suggestion {
  gameName: string
  tagLine: string
  region: string
  profileIconId: number | null
  summonerLevel: number | null
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
        // If full Name#TAG typed, validate directly via Riot API
        if (hasTag && tagPart.length >= 2) {
          const res = await fetch(
            `/api/riot/account?gameName=${encodeURIComponent(namePart)}&tagLine=${encodeURIComponent(tagPart)}&region=${region}`
          )
          if (res.ok) {
            const account = (await res.json()) as { gameName: string; tagLine: string }
            setSuggestions([
              {
                gameName: account.gameName,
                tagLine: account.tagLine,
                region,
                profileIconId: null,
                summonerLevel: null,
              },
            ])
          } else if (res.status === 404) {
            setSuggestions([])
            setError("Joueur introuvable")
          } else {
            setSuggestions([])
            setError("Recherche indisponible (vérifie la clé API Riot)")
          }
          return
        }

        // Otherwise search local DB
        const res = await fetch(`/api/search?q=${encodeURIComponent(namePart)}&region=${region}`)
        const data = (await res.json()) as Suggestion[]
        setSuggestions(data)
        if (data.length === 0) {
          setError("Aucun résultat — tape le pseudo complet avec #TAG")
        }
      } catch {
        setSuggestions([])
        setError("Erreur réseau")
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, region])

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
    router.push(`/profile/${reg}/${encodeURIComponent(gameName)}/${tagLine}`)
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
            placeholder="Joueur#EUW"
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
          Rechercher
        </button>
      </form>

      {/* Dropdown */}
      {(showRecent || showSuggestions) && (
        <div className="absolute top-full mt-1 w-full rounded-xl border bg-card shadow-xl z-50 overflow-hidden">
          {/* Live suggestions */}
          {showSuggestions && (
            <>
              {loading ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">Recherche…</div>
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
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{s.gameName}</span>
                    <span className="text-muted-foreground text-sm">#{s.tagLine}</span>
                    {s.summonerLevel && (
                      <span className="text-xs text-muted-foreground ml-1">
                        niv. {s.summonerLevel}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
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
                Récents
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
