import type { NextConfig } from "next"

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ddragon.leagueoflegends.com" },
      { protocol: "https", hostname: "raw.communitydragon.org" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
}

export default config
