import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { profiles } from "./users"

export const summoners = pgTable("summoners", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  puuid: text().notNull().unique(),
  gameName: text("game_name").notNull(),
  tagLine: text("tag_line").notNull(),
  summonerId: text("summoner_id"),
  accountId: text("account_id"),
  profileIconId: integer("profile_icon_id"),
  summonerLevel: integer("summoner_level"),
  region: text().notNull(),
  isPrimary: boolean("is_primary").default(false),
  // Cached current Solo/Duo rank — reused for "rang moyen des parties" so we
  // don't re-hit league-v4 for every participant of every game.
  soloTier: text("solo_tier"),
  soloDivision: text("solo_division"),
  soloLeaguePoints: integer("solo_league_points"),
  rankCheckedAt: timestamp("rank_checked_at", { withTimezone: true }),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow(),
})

export type Summoner = typeof summoners.$inferSelect
export type NewSummoner = typeof summoners.$inferInsert
