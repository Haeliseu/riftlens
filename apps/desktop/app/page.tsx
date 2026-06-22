"use client"

import {
  getChampionIconUrl,
  getProfileIconUrl,
  getRankIconUrl,
  type TierName,
} from "@riftlens/riot-api"
import Image from "next/image"
import { type RankEntry, type RecentMatch, useProfileDashboard } from "@/hooks/useProfileDashboard"

/** "DIAMOND" (LCU) → "Diamond" (asset name). */
function capTier(tier: string): TierName {
  return ((tier[0] ?? "") + tier.slice(1).toLowerCase()) as TierName
}

const QUEUE_LABEL: Record<number, string> = {
  420: "Solo/Duo",
  440: "Flex",
  450: "ARAM",
  400: "Normale",
  430: "Normale",
  1700: "Arena",
}

function queueLabel(id: number): string {
  return QUEUE_LABEL[id] ?? "Autre"
}

function kda(m: RecentMatch): string {
  const r = m.deaths === 0 ? m.kills + m.assists : (m.kills + m.assists) / m.deaths
  return r.toFixed(2)
}

function RankCard({ label, rank }: { label: string; rank: RankEntry | null }) {
  const games = rank ? rank.wins + rank.losses : 0
  const wr = rank && games > 0 ? Math.round((rank.wins / games) * 100) : 0
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      {rank ? (
        <Image src={getRankIconUrl(capTier(rank.tier))} alt={rank.tier} width={40} height={40} />
      ) : (
        <div className="h-10 w-10 rounded-full bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {rank ? (
          <>
            <p className="text-sm font-semibold">
              {capTier(rank.tier)} {rank.division} · {rank.lp} LP
            </p>
            <p className="text-xs text-muted-foreground">
              {rank.wins}V {rank.losses}D · {wr}%
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Non classé</p>
        )}
      </div>
    </div>
  )
}

function MatchRow({ m }: { m: RecentMatch }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-l-4 p-2 ${
        m.win ? "border-l-[var(--color-win)]" : "border-l-[var(--color-loss)]"
      }`}
    >
      <Image
        src={getChampionIconUrl(m.championId)}
        alt=""
        width={32}
        height={32}
        className="rounded-md"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {m.kills}/{m.deaths}/{m.assists}
          <span className="ml-1 text-xs font-normal text-muted-foreground">({kda(m)} KDA)</span>
        </p>
        <p className="text-xs text-muted-foreground">{queueLabel(m.queueId)}</p>
      </div>
      <span
        className={`text-xs font-semibold ${m.win ? "text-[var(--color-win)]" : "text-[var(--color-loss)]"}`}
      >
        {m.win ? "Victoire" : "Défaite"}
      </span>
    </div>
  )
}

export default function HomePage() {
  const { data, connected, loading, refresh } = useProfileDashboard()

  if (loading) {
    return <Centered>Connexion au client League…</Centered>
  }
  if (!connected || !data) {
    return <Centered>Lance League of Legends pour voir ton profil.</Centered>
  }

  const { identity, solo, flex, matches } = data

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="flex items-center gap-3">
        <Image
          src={getProfileIconUrl(identity.profileIconId)}
          alt=""
          width={56}
          height={56}
          className="rounded-lg"
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {identity.name}
            {identity.tagLine && (
              <span className="text-base font-normal text-muted-foreground">
                #{identity.tagLine}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Niveau {identity.summonerLevel}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Actualiser
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RankCard label="Classé Solo/Duo" rank={solo} />
        <RankCard label="Classé Flexible" rank={flex} />
      </div>

      <section className="space-y-1.5">
        <h2 className="text-sm font-semibold text-muted-foreground">Parties récentes</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune partie récente.</p>
        ) : (
          matches.map((m) => <MatchRow key={m.gameId} m={m} />)
        )}
      </section>
    </main>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
