# RiftLens — League of Legends Tracker

RiftLens is a free, multi-platform League of Legends tracker: rich profiles,
match history, leaderboard, rules-based coaching, live game, and a desktop
companion with in-client overlays. Built to compete with op.gg / Porofessor
while staying **100% free** and **compliant with Riot's developer policy** (no
shaming, no alternative MMR, real assets, server-side key only).

> **Keep this README current.** Update it on every significant change — a new
> feature, an architecture/routing change, or a deployment/env change. Treat a
> stale README as a bug.

## Monorepo

```
riftlens/
├── apps/
│   ├── web/        # Next.js 16 App Router → Vercel (the main product)
│   ├── desktop/    # Tauri 2 + Rust → native app, LCU overlays + HUD
│   └── mobile/     # Expo / React Native (early)
└── packages/
    ├── ui/         # Shared UI (Tailwind v4)
    ├── db/         # Drizzle ORM + Postgres schema & migrations
    ├── riot-api/   # Typed Riot API wrapper (Zod), tags, session, ranks
    ├── lcu/        # League Client (LCU) SDK
    └── config/     # Shared tsconfig / vitest
```

## Stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Web      | Next.js 16 App Router, React 19, TypeScript 6 (strict)      |
| Styling  | Tailwind v4, Biome (lint/format)                            |
| Data     | Drizzle ORM + Supabase Postgres (pooler), Upstash Redis     |
| Client   | React Query, path-based i18n (EN default, `/fr`)            |
| Auth     | Better Auth — **Riot Sign-On (RSO) only**                   |
| Desktop  | Tauri 2 + Rust LCU client                                   |
| API      | Riot API (account-v1, summoner/league-v4, match-v5, spectator-v5, …) |

## Features (web)

- **Profiles** — ranked (Solo/Flex), LP chart, champion stats, role performance,
  ping stats, mastery, challenges, "played with/against" history.
- **Match history** — per-game LP (with promotion/demotion rank icon), stylised
  VS matchup tile, expandable detail (build, skill order, laning @15, runes).
- **Coaching** — rank-scaled, role-aware benchmarks (no LLM); plus timeline
  "deaths around objectives" analysis.
- **Leaderboard** — Challenger/GM/Master, enriched with avatars + top champions,
  role filter, and a live "LIVE" badge (links to the player's live tab).
- **Live game** — spectator-v5 with per-player rank, recent form, and honoring
  tags (on-fire, one-trick, carry-potential, fed-last-game).
- **Champions** — list + free rotation.
- **i18n** — English (default) at the root, French under `/fr`; every UI string
  is a translation key (never mixed languages).
- **SEO** — metadata, OpenGraph + generated OG image, robots, sitemap, manifest,
  hreflang. Footer + `/privacy` + `/terms` with the Riot disclaimer.

## Desktop (apps/desktop)

Tauri 2 app with a Rust LCU layer (process detection, credentials, HTTPS client).
Main window mirrors the web profile sourced from the local client; overlay and
champ-select windows exist for the in-game HUD (work in progress).

## Setup

### Prerequisites

- Node.js 22, pnpm 10.12.4 (`corepack enable && corepack prepare pnpm@10.12.4 --activate`)
- Rust stable (desktop only)

### Install & env

```bash
pnpm install
# create apps/web/.env.local with the variables below
```

Web environment variables:

| Var                                     | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `RIOT_API_KEY`                          | Riot API key — **server-side only, never public**  |
| `DATABASE_URL`                          | Supabase Postgres pooler URL (port 6543)           |
| `UPSTASH_REDIS_REST_URL`                | Upstash Redis (cache) — optional, graceful no-op   |
| `UPSTASH_REDIS_REST_TOKEN`              | Upstash Redis token                                |
| `BETTER_AUTH_SECRET`                    | `openssl rand -base64 32`                          |
| `BETTER_AUTH_URL`                       | App URL (auth callbacks)                            |
| `NEXT_PUBLIC_APP_URL`                   | Public site URL (SEO canonicals / hreflang / sitemap) |
| `RIOT_CLIENT_ID` / `RIOT_CLIENT_SECRET` | RSO OAuth (pending Riot approval)                  |
| `CRON_SECRET`                           | Guards `/api/cron/refresh-profiles`                |

### Database migrations

Migrations are generated with drizzle-kit and **applied manually in the Supabase
SQL editor** (the pooler doesn't run migrations on deploy).

```bash
cd packages/db && pnpm drizzle-kit generate   # produces migrations/NNNN_*.sql
# then paste the new SQL into Supabase
```

### Develop

```bash
pnpm dev --filter=web        # web only (http://localhost:3000)
pnpm --filter desktop dev    # desktop (needs Rust + League client)
pnpm dev                     # everything
```

### Verify

```bash
pnpm typecheck
pnpm lint                    # Biome
pnpm test
pnpm --filter web build
```

## Auth (RSO)

Sign-in is **Riot Sign-On only**. On login the Riot account fills the profile
(puuid + Riot ID); a cron refreshes linked profiles. RSO stays inert until
`RIOT_CLIENT_ID` / `RIOT_CLIENT_SECRET` are set, so the app builds without it.
Redirect URI: `{BETTER_AUTH_URL}/api/auth/oauth2/callback/riot`.

## Deployment

- **Vercel Hobby (free).** Production branch `main`; each push deploys (via
  `turbo-ignore`, so desktop-only commits are skipped as "not affected").
- **Crons must be daily on Hobby** — `vercel.json` runs `/api/cron/refresh-profiles`
  daily. For true hourly: upgrade to Pro or trigger the endpoint externally with
  `Authorization: Bearer $CRON_SECRET`.
- Domain: use a **gTLD** (`.com`/`.gg`/`.lol`) — English is the flagship language
  at the root, French under `/fr`. Set `NEXT_PUBLIC_APP_URL` to it.

## Riot legal

RiftLens isn't endorsed by Riot Games and doesn't reflect the views or opinions
of Riot Games or anyone officially involved in producing or managing League of
Legends. League of Legends and Riot Games are trademarks or registered
trademarks of Riot Games, Inc.
