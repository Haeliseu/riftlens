import { db } from "@riftlens/db"
import { profiles } from "@riftlens/db/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth } from "better-auth/plugins"

// Riot Sign-On (RSO) is the only sign-in method: the Riot account is the source
// of truth and fills the user's profile (puuid + Riot ID). Only registered when
// credentials are present, so the build keeps working until Riot approves the
// RSO client. After approval, set RIOT_CLIENT_ID / RIOT_CLIENT_SECRET and add
// the redirect URI in the Riot portal:
//   {BETTER_AUTH_URL}/api/auth/oauth2/callback/riot
const riotEnabled = !!(process.env.RIOT_CLIENT_ID && process.env.RIOT_CLIENT_SECRET)

interface RiotAccount {
  puuid: string
  gameName?: string
  tagLine?: string
}

/** Resolve the signed-in Riot account from the RSO access token. */
async function fetchRiotAccount(accessToken: string): Promise<RiotAccount | null> {
  // accounts/me is routing-agnostic; europe works for any account.
  const res = await fetch("https://europe.api.riotgames.com/riot/account/v1/accounts/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return (await res.json()) as RiotAccount
}

// The puuid/Riot ID are carried to the create hook via the synthesized email
// (puuid) and name (gameName#tagLine), then persisted onto the profile.
const RSO_EMAIL_DOMAIN = "rso.riftlens.local"

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
            scopes: ["openid"],
            async getUserInfo(tokens) {
              const me = tokens.accessToken ? await fetchRiotAccount(tokens.accessToken) : null
              if (!me) return null
              const riotId = me.gameName && me.tagLine ? `${me.gameName}#${me.tagLine}` : me.puuid
              return {
                id: me.puuid,
                email: `${me.puuid}@${RSO_EMAIL_DOMAIN}`,
                emailVerified: true,
                name: riotId,
                image: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            },
          },
        ],
      }),
    ]
  : []

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  // Riot login is authoritative — no email/password or other social providers.
  emailAndPassword: { enabled: false },
  plugins,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const puuid = user.email?.endsWith(`@${RSO_EMAIL_DOMAIN}`)
            ? user.email.split("@")[0]
            : null
          const [gameName, tagLine] = user.name?.includes("#") ? user.name.split("#") : [null, null]
          await db
            .insert(profiles)
            .values({
              id: user.id,
              ...(puuid ? { riotPuuid: puuid, gameName, tagLine } : {}),
            })
            .onConflictDoNothing()
        },
      },
    },
  },
})

export type Auth = typeof auth
