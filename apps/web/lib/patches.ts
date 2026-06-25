/**
 * League patch-notes helpers. Riot has no patch-notes API, so we derive the
 * patch numbers from Data Dragon's versions list and link to the official notes
 * pages. Riot's marketing patch number is year-based (e.g. DDragon 16.13 →
 * "Patch 26.13", since 2010 + 16 = 2026), and the article slug is
 * `league-of-legends-patch-<YY>-<minor>-notes`.
 */

function parts(version: string): { yy: number; minor: number } | null {
  const [maj, min] = version.split(".")
  const major = Number(maj)
  const minor = Number(min)
  if (!Number.isInteger(major) || !Number.isInteger(minor)) return null
  return { yy: major + 10, minor }
}

const riotLocale = (locale: string) => (locale === "fr" ? "fr-fr" : "en-us")

/** Marketing patch label for a DDragon version, e.g. "16.13.1" → "26.13". */
export function patchLabel(version: string): string | null {
  const p = parts(version)
  return p ? `${p.yy}.${p.minor}` : null
}

/** Official patch-notes article URL for a version + app locale. */
export function patchNotesUrl(version: string, locale: string): string | null {
  const p = parts(version)
  if (!p) return null
  return `https://www.leagueoflegends.com/${riotLocale(locale)}/news/game-updates/league-of-legends-patch-${p.yy}-${p.minor}-notes`
}

/** The official patch-notes hub (lists every patch) for the locale. */
export function patchNotesHubUrl(locale: string): string {
  return `https://www.leagueoflegends.com/${riotLocale(locale)}/news/tags/patch-notes/`
}

/**
 * Recent patches (newest first), deduplicated to one entry per major.minor.
 * Fetches Data Dragon's versions list; returns [] on failure.
 */
export async function fetchRecentPatches(limit = 10): Promise<string[]> {
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 86_400 },
    })
    if (!res.ok) return []
    const all = (await res.json()) as string[]
    const seen = new Set<string>()
    const out: string[] = []
    for (const v of all) {
      const mm = v.split(".").slice(0, 2).join(".")
      if (seen.has(mm)) continue
      seen.add(mm)
      out.push(v)
      if (out.length >= limit) break
    }
    return out
  } catch {
    return []
  }
}
