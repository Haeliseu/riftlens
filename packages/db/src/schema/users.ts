import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

// Better Auth manages its own tables (user, session, account, verification)
// via the Drizzle adapter. Generate them with:
//   npx better-auth generate --config apps/web/src/lib/auth.ts
//
// This table stores RiftLens-specific business data, linked to Better Auth via user.id
export const profiles = pgTable("profiles", {
  id: text().primaryKey(), // = better-auth user.id (text, not uuid)
  username: text().unique(),
  avatarUrl: text("avatar_url"),
  defaultRegion: text("default_region").default("EUW1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
