import { useQuery } from "@tanstack/react-query"

export interface MatchDetailParticipant {
  puuid: string
  gameName: string
  tagLine: string
  teamId: number
  championId: number
  championName: string
  champLevel: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  cs: number
  csPerMin: number
  goldEarned: number
  goldPerMin: number
  damage: number
  damageTaken: number
  visionScore: number
  visionPerMin: number
  wardsPlaced: number
  wardsKilled: number
  controlWards: number
  spellCasts: number[]
  position: string
  items: (string | null)[]
  trinket: string | null
  spells: (string | null)[]
  runes: {
    keystone: string | null
    primary: (string | null)[]
    secondary: (string | null)[]
    shards: (string | null)[]
  }
  pings: { key: string; icon: string; count: number }[]
  totalPings: number
}

export interface MatchDetail {
  matchId: string
  region: string
  queueId: number | null
  gameDurationS: number
  participants: MatchDetailParticipant[]
}

export function useMatchDetail(matchId: string | null, region = "EUW1") {
  return useQuery({
    queryKey: ["match-detail", region, matchId],
    queryFn: async () => {
      const res = await fetch(`/api/riot/match/${matchId}?region=${region}`)
      if (!res.ok) throw new Error("Match detail unavailable")
      return (await res.json()) as MatchDetail
    },
    staleTime: 24 * 3_600_000,
    enabled: !!matchId,
  })
}
