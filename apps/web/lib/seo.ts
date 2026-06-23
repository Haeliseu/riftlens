/** Central SEO config + the legally required Riot disclaimer. */

export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
)

export const siteConfig = {
  name: "RiftLens",
  url: siteUrl,
  description:
    "RiftLens — tracker League of Legends : profils, historique, classement, coaching et live game. Suis et améliore tes performances, gratuitement.",
  descriptionEn:
    "RiftLens — League of Legends tracker: profiles, match history, leaderboard, coaching and live game. Track and improve your performance, for free.",
  keywords: [
    "League of Legends",
    "LoL tracker",
    "LoL stats",
    "op.gg",
    "classement LoL",
    "leaderboard",
    "live game",
    "coaching LoL",
    "RiftLens",
    "ranked",
    "winrate",
    "KDA",
  ],
  locale: "fr_FR",
  alternateLocale: "en_US",
} as const

/** Required by Riot's developer policy on every product surface. */
export const RIOT_DISCLAIMER =
  "RiftLens n'est pas approuvé par Riot Games et ne reflète pas les opinions de Riot Games ou de toute personne impliquée officiellement dans la production ou la gestion de League of Legends. League of Legends et Riot Games sont des marques de Riot Games, Inc."

export const RIOT_DISCLAIMER_EN =
  "RiftLens isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc."
