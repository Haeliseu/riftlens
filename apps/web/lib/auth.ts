import { db } from "@riftlens/db"
import { profiles } from "@riftlens/db/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth } from "better-auth/plugins"

// Riot Sign-On (RSO) — OAuth2. Only registered when credentials are present, so
// the app keeps working until Riot approves the RSO client. After approval, set
// RIOT_CLIENT_ID / RIOT_CLIENT_SECRET and add the redirect URI in the Riot portal:
//   {BETTER_AUTH_URL}/api/auth/oauth2/callback/riot
// Linking the puuid: call https://auth.riotgames.com/userinfo then
// /riot/account/v1/accounts/me with the access token (see TODO.md, RSO section).
const riotEnabled = !!(process.env.RIOT_CLIENT_ID && process.env.RIOT_CLIENT_SECRET)

const plugins = riotEnabled
  ? [
      genericOAuth({
        config: [
          {
            providerId: "riot",
            clientId: process.env.RIOT_CLIENT_ID as string,
            clientSecret: process.env.RIOT_CLIENT_SECRET as string,
            authorizationUrl: "https://auth.riotgames.com/authorize",
            tokenUrl: "https://auth.riotgames.com/token",
            userInfoUrl: "https://auth.riotgames.com/userinfo",
            scopes: ["openid"],
          },
        ],
      }),
    ]
  : []

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins,
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(profiles).values({ id: user.id }).onConflictDoNothing()
        },
      },
    },
  },
})

export type Auth = typeof auth
