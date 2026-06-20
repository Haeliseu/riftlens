// Resolves LoL asset icon URLs (items, summoner spells, runes) from numeric ids
// using CommunityDragon metadata, cached in-memory per server instance.

const CD = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default"

function toUrl(iconPath: string): string {
  return CD + iconPath.replace(/^\/lol-game-data\/assets/i, "").toLowerCase()
}

interface Meta {
  items: Map<number, string>
  spells: Map<number, string>
  perks: Map<number, string>
}

let meta: Meta | null = null
let fetchedAt = 0
const TTL = 6 * 3_600_000

async function load(): Promise<Meta> {
  if (meta && Date.now() - fetchedAt < TTL) return meta
  const [items, spells, perks] = await Promise.all([
    fetch(`${CD}/v1/items.json`).then(
      (r) => r.json() as Promise<{ id: number; iconPath: string }[]>
    ),
    fetch(`${CD}/v1/summoner-spells.json`).then(
      (r) => r.json() as Promise<{ id: number; iconPath: string }[]>
    ),
    fetch(`${CD}/v1/perks.json`).then(
      (r) => r.json() as Promise<{ id: number; iconPath: string }[]>
    ),
  ])
  meta = {
    items: new Map(items.filter((i) => i.iconPath).map((i) => [i.id, toUrl(i.iconPath)])),
    spells: new Map(spells.filter((s) => s.iconPath).map((s) => [s.id, toUrl(s.iconPath)])),
    perks: new Map(perks.filter((p) => p.iconPath).map((p) => [p.id, toUrl(p.iconPath)])),
  }
  fetchedAt = Date.now()
  return meta
}

// Stat shard ids -> CommunityDragon StatMods icons (not in perks.json).
const STAT_SHARDS: Record<number, string> = {
  5008: `${CD}/v1/perk-images/statmods/statmodsadaptiveforceicon.png`,
  5005: `${CD}/v1/perk-images/statmods/statmodsattackspeedicon.png`,
  5007: `${CD}/v1/perk-images/statmods/statmodscdrscalingicon.png`,
  5011: `${CD}/v1/perk-images/statmods/statmodshealthscalingicon.png`,
  5013: `${CD}/v1/perk-images/statmods/statmodstenacityicon.png`,
  5001: `${CD}/v1/perk-images/statmods/statmodshealthplusicon.png`,
  5010: `${CD}/v1/perk-images/statmods/statmodsmovementspeedicon.png`,
}

export interface ResolvedAssets {
  item(id: number | undefined): string | null
  spell(id: number | undefined): string | null
  perk(id: number | undefined): string | null
}

export async function resolveAssets(): Promise<ResolvedAssets> {
  const m = await load().catch(() => null)
  return {
    item: (id) => (id && id > 0 ? (m?.items.get(id) ?? null) : null),
    spell: (id) => (id ? (m?.spells.get(id) ?? null) : null),
    perk: (id) => (id ? (m?.perks.get(id) ?? STAT_SHARDS[id] ?? null) : null),
  }
}
