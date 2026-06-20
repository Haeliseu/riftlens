import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

// End-of-season rank archive. Riot does NOT expose past seasons, so this can
// only be filled going forward (one row per puuid/queue/season).
export const rankHistory = pgTable(
  "rank_history",
  {
    id: uuid().primaryKey().defaultRandom(),
    puuid: text().notNull(),
    season: text().notNull(), // e.g. "S2-2026"
    queueId: integer("queue_id").notNull(),
    tier: text().notNull(),
    division: text().notNull(),
    leaguePoints: integer("league_points"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("uniq_rh_puuid_season_queue").on(t.puuid, t.season, t.queueId),
    index("idx_rh_puuid").on(t.puuid),
  ]
)

export type RankHistory = typeof rankHistory.$inferSelect
export type NewRankHistory = typeof rankHistory.$inferInsert
