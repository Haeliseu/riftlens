"use client"

import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useState } from "react"

interface LcuSummoner {
  puuid: string
  displayName: string
  gameName: string
  tagLine: string
  profileIconId: number
  summonerLevel: number
}

export interface RankEntry {
  tier: string // UPPERCASE from LCU, e.g. "DIAMOND" / "NONE"
  division: string
  lp: number
  wins: number
  losses: number
}

export interface RecentMatch {
  gameId: number
  queueId: number
  championId: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  gameCreation: number
  gameDuration: number
}

export interface DashboardData {
  identity: {
    puuid: string
    name: string
    tagLine: string
    profileIconId: number
    summonerLevel: number
  }
  solo: RankEntry | null
  flex: RankEntry | null
  matches: RecentMatch[]
}

export interface DashboardState {
  data: DashboardData | null
  connected: boolean
  loading: boolean
  refresh: () => void
}

type Creds = { port: number; password: string }
// biome-ignore lint/suspicious/noExplicitAny: raw LCU JSON
type Json = any

function parseRank(queue: Json): RankEntry | null {
  if (!queue?.tier || queue.tier === "NONE") return null
  return {
    tier: String(queue.tier),
    division: String(queue.division ?? ""),
    lp: Number(queue.leaguePoints ?? 0),
    wins: Number(queue.wins ?? 0),
    losses: Number(queue.losses ?? 0),
  }
}

function parseMatches(raw: Json, puuid: string): RecentMatch[] {
  const games: Json[] = raw?.games?.games ?? []
  return games.map((g) => {
    // Map the current summoner to their participant via the identity list.
    const identity = (g.participantIdentities ?? []).find((pi: Json) => pi?.player?.puuid === puuid)
    const pid = identity?.participantId
    const part =
      (g.participants ?? []).find((p: Json) => p.participantId === pid) ?? g.participants?.[0]
    const s = part?.stats ?? {}
    return {
      gameId: Number(g.gameId ?? 0),
      queueId: Number(g.queueId ?? 0),
      championId: Number(part?.championId ?? 0),
      win: Boolean(s.win),
      kills: Number(s.kills ?? 0),
      deaths: Number(s.deaths ?? 0),
      assists: Number(s.assists ?? 0),
      gameCreation: Number(g.gameCreation ?? 0),
      gameDuration: Number(g.gameDuration ?? 0),
    }
  })
}

/** Builds the profile dashboard entirely from the local League client (LCU). */
export function useProfileDashboard(): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const creds = await invoke<Creds>("get_lcu_credentials")
      const [summoner, ranked, matchesRaw] = await Promise.all([
        invoke<LcuSummoner>("get_current_summoner", { credentials: creds }),
        invoke<Json>("get_ranked_stats", { credentials: creds }),
        invoke<Json>("get_recent_matches", { credentials: creds }),
      ])
      const queueMap = ranked?.queueMap ?? {}
      setData({
        identity: {
          puuid: summoner.puuid,
          name: summoner.gameName || summoner.displayName,
          tagLine: summoner.tagLine,
          profileIconId: summoner.profileIconId,
          summonerLevel: summoner.summonerLevel,
        },
        solo: parseRank(queueMap.RANKED_SOLO_5x5),
        flex: parseRank(queueMap.RANKED_FLEX_SR),
        matches: parseMatches(matchesRaw, summoner.puuid),
      })
      setConnected(true)
    } catch {
      setConnected(false)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  return { data, connected, loading, refresh: load }
}
