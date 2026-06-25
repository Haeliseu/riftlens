/**
 * Full champion data from Data Dragon (lore, stats + growth, abilities). The
 * resolved per-rank damage ratios aren't in DDragon (the tooltips use
 * champion-specific `{{ }}` placeholders the game resolves), so we render the
 * clean `description` plus the per-rank cooldown/cost/range that DDragon does
 * provide. Locale-aware (fr_FR / en_US).
 */

export interface ChampionSpell {
  id: string
  name: string
  description: string
  cooldownBurn: string
  costBurn: string
  rangeBurn: string
  maxrank: number
  image: { full: string }
}

export interface ChampionSkin {
  num: number
  name: string
  chromas: boolean
}

export interface ChampionDetail {
  id: string
  key: string
  name: string
  title: string
  lore: string
  tags: string[]
  partype: string
  stats: Record<string, number>
  spells: ChampionSpell[]
  passive: { name: string; description: string; image: { full: string } }
  skins: ChampionSkin[]
  allytips: string[]
  enemytips: string[]
}

let versionCache: { value: string; at: number } | null = null

async function ddragonVersion(): Promise<string> {
  if (versionCache && Date.now() - versionCache.at < 86_400_000) return versionCache.value
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 86_400 },
    })
    const all = (await res.json()) as string[]
    const v = all[0] ?? "15.13.1"
    versionCache = { value: v, at: Date.now() }
    return v
  } catch {
    return "15.13.1"
  }
}

export interface ChromaInfo {
  name: string
  color: string
}

/**
 * Chroma names per skin number, from CommunityDragon (DDragon only exposes a
 * `chromas` boolean). Keyed by skin num; skins without chromas are omitted.
 */
export async function fetchChromas(
  key: string,
  locale: string
): Promise<Record<number, ChromaInfo[]>> {
  const loc = locale === "fr" ? "fr_fr" : "default"
  const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${loc}/v1/champions/${key}.json`
  try {
    const res = await fetch(url, { next: { revalidate: 86_400 } })
    if (!res.ok) return {}
    const data = (await res.json()) as {
      skins?: { id: number; chromas?: { name: string; colors?: string[] }[] }[]
    }
    const champId = Number(key)
    const out: Record<number, ChromaInfo[]> = {}
    for (const s of data.skins ?? []) {
      const chromas = (s.chromas ?? []).map((c) => ({
        name: c.name,
        color: c.colors?.[0] ?? "#888",
      }))
      if (chromas.length) out[s.id - champId * 1000] = chromas
    }
    return out
  } catch {
    return {}
  }
}

export async function fetchChampion(
  alias: string,
  locale: string
): Promise<{ champion: ChampionDetail; version: string } | null> {
  const version = await ddragonVersion()
  const dl = locale === "fr" ? "fr_FR" : "en_US"
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/${dl}/champion/${encodeURIComponent(alias)}.json`,
      { next: { revalidate: 86_400 } }
    )
    if (!res.ok) return null
    const json = (await res.json()) as { data?: Record<string, ChampionDetail> }
    const champion = json.data ? Object.values(json.data)[0] : undefined
    return champion ? { champion, version } : null
  } catch {
    return null
  }
}

const DD = "https://ddragon.leagueoflegends.com/cdn"

export const spellIconUrl = (version: string, full: string) => `${DD}/${version}/img/spell/${full}`
export const passiveIconUrl = (version: string, full: string) =>
  `${DD}/${version}/img/passive/${full}`
// Splash/loading art is version-free, keyed by the champion id (e.g. "Aatrox").
export const championSplashUrl = (id: string) => `${DD}/img/champion/splash/${id}_0.jpg`
/** Per-skin loading art (vertical) — good for thumbnails. */
export const skinLoadingUrl = (id: string, num: number) =>
  `${DD}/img/champion/loading/${id}_${num}.jpg`
/** CommunityDragon centered splash art (champion well-framed), per numeric key + skin. */
export const centeredSplashUrl = (key: string, num: number) =>
  num === 0
    ? `https://cdn.communitydragon.org/latest/champion/${key}/splash-art/centered`
    : `https://cdn.communitydragon.org/latest/champion/${key}/splash-art/centered/skin/${num}`

/** Strip DDragon's pseudo-HTML to plain text, keeping <br> as line breaks. */
export function cleanText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** The Q/W/E/R/Passive slot key for an ability index. */
export const SPELL_KEYS = ["Q", "W", "E", "R"] as const
