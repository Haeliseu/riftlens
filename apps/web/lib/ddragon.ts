// Client-safe Data Dragon URL builders (items, runes). Versioned where DDragon
// requires it (items), version-free where it doesn't (rune perk-images).

const DD = "https://ddragon.leagueoflegends.com/cdn"

export const itemIconUrl = (version: string, full: string) => `${DD}/${version}/img/item/${full}`
export const runeIconUrl = (icon: string) => `${DD}/img/${icon}`

/** Strip DDragon's pseudo-HTML (<br>, <stats>, …) to readable text. */
export function cleanDdragon(html: string): string {
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
