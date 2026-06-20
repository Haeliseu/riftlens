import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { profiles } from "./users"

export const runePages = pgTable("rune_pages", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  championId: integer("champion_id"),
  championName: text("champion_name"),
  name: text().notNull(),
  primaryStyleId: integer("primary_style_id"),
  subStyleId: integer("sub_style_id"),
  selectedPerkIds: integer("selected_perk_ids").array(),
  statShards: integer("stat_shards").array(),
  source: text().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export type RunePage = typeof runePages.$inferSelect
export type NewRunePage = typeof runePages.$inferInsert
