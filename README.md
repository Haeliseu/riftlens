# RiftLens — LoL Tracker

Tracker League of Legends multi-plateforme. Mieux que DPM.LOL et OP.GG sur les axes :
- LP Chart interactif dans le profil
- Peak + rang moyen des parties (pas de MMR numérique)
- Filtre Saison 2 2026 garanti
- Feature "déjà joué avec/contre"
- Overlay streamer Tauri
- Buddy panel en champ select
- Import de runes automatique

## Stack

| Couche | Technologie |
|--------|-------------|
| Web | Next.js 16 App Router + React 19 |
| Desktop | Tauri 2.x + Rust |
| Mobile | Expo 56 + React Native 0.79 |
| UI | shadcn/ui + Tailwind v4 |
| DB | Drizzle ORM + Supabase PostgreSQL |
| Auth | Better Auth 1.6 |
| LCU | SDK TypeScript + commandes Rust |
| API | Riot Games API v4/v5 |

## Setup

### Prérequis

- Node.js 22 LTS
- pnpm 10.12.4 (`corepack enable && corepack prepare pnpm@10.12.4 --activate`)
- Rust stable (pour Tauri)

### Installation

```bash
git clone https://github.com/yourorg/riftlens.git
cd riftlens
cp .env.example .env
# Remplir .env avec vos clés
pnpm install
```

### Variables d'environnement

Copier `.env.example` vers `.env` et remplir :

1. **BETTER_AUTH_SECRET** : `openssl rand -base64 32`
2. **DATABASE_URL** : URL PostgreSQL Supabase
3. **RIOT_API_KEY** : Clé développeur sur [developer.riotgames.com](https://developer.riotgames.com)

### Migrations Better Auth

```bash
cd apps/web
npx better-auth generate --config lib/auth.ts
cd ../..
cd packages/db
pnpm db:generate && pnpm db:migrate
```

### Développement

```bash
# Web uniquement
pnpm dev --filter=web

# Tout en parallèle
pnpm dev

# Desktop
pnpm dev --filter=desktop
```

### Tests

```bash
pnpm test
pnpm test --filter=@riftlens/riot-api -- --coverage
```

## Architecture

```
riftlens/
├── apps/
│   ├── web/        # Next.js 16 → Vercel
│   ├── desktop/    # Tauri 2.x → binaires natifs
│   └── mobile/     # Expo 56 → iOS/Android
└── packages/
    ├── ui/         # shadcn/ui + Tailwind v4
    ├── db/         # Drizzle ORM + schémas
    ├── riot-api/   # Wrapper Riot API typé
    ├── lcu/        # SDK LCU TypeScript
    └── config/     # tsconfig + vitest partagés
```

## Features

### LP Chart
SVG interactif filtré Saison 2 2026. Peak en or, position actuelle en bleu, tooltip avec rang moyen des parties au survol.

### Rang moyen des parties
Médiane des rangs de tous les participants des dernières parties ranked. Plus significatif qu'un MMR numérique.

### "Déjà joué avec/contre"
Détecte les parties communes en BDD via la table `match_participants`. Badge sur l'icône du joueur, tooltip détaillé, filtre dans l'historique.

### Overlay streamer
Fenêtre Tauri always-on-top, 226px large, positionnée bas-gauche. Affiche rang, session W/L en grand, et les 9 autres joueurs avec WR champ/compte et barre de chaleur.

### Buddy panel champ select
2 colonnes alliés/ennemis. Chaque carte affiche rang, WR champion S2 2026, WR compte S2 2026, KDA, tags (on-fire, tilting, one-trick…) et indicateur "déjà joué".

### Import de runes
Commande Rust via LCU API : supprime la page "RiftLens Auto-Import" existante puis la recrée avec les runes suggérées.

## Saison 2 2026

```typescript
export const SEASON_2_2026_START_MS = 1745884800000 // 2026-04-29T00:00:00Z
```

Toutes les stats et charts sont filtrés à partir de cette date. Ne jamais agréger avec la Saison 1 2026.

## CI/CD

- **CI** : lint Biome + typecheck + tests (couverture ≥ 80%) + build web
- **Deploy** : push sur `main` → Vercel production automatique
- **Release desktop** : tag `v*.*.*` → builds Windows/macOS/Linux en parallèle
