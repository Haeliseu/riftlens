import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@riftlens/db"
import { profiles } from "@riftlens/db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    discord: {
      clientId: process.env["DISCORD_CLIENT_ID"]!,
      clientSecret: process.env["DISCORD_CLIENT_SECRET"]!,
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
