"use client"

import { useEffect } from "react"

const KEY = "riftlens:recent"
const MAX = 6

interface Props {
  gameName: string
  tagLine: string
  region: string
  profileIconId?: number | null
}

/**
 * Records the visited profile (with its avatar) into the shared recent-searches
 * list, so the navbar/home dropdowns can show an avatar rectangle per entry.
 */
export function RecordRecentVisit({ gameName, tagLine, region, profileIconId }: Props) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const cur = raw ? (JSON.parse(raw) as Props[]) : []
      const next = [
        { gameName, tagLine, region, profileIconId: profileIconId ?? null },
        ...cur.filter((r) => r.gameName !== gameName || r.tagLine !== tagLine),
      ].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [gameName, tagLine, region, profileIconId])

  return null
}
