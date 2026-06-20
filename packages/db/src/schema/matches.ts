import { bigint, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const matches = pgTable("matches", {
  matchId: text("match_id").primaryKey(),
  region: text().notNull(),
  gameMode: text("game_mode"),
  gameType: text("game_type"),
  gameDuration: integer("game_duration"),
  gameCreation: bigint("game_creation", { mode: "number" }),
  patch: text(),
  rawData: jsonb("raw_data"),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow(),
})

export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
