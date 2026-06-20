import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

// Point-in-time rank snapshots, recorded whenever a profile is viewed.
// Powers the LP chart and the season peak — data Riot does NOT expose
// historically, so it accumulates from the moment we start tracking.
export const lpSnapshots = pgTable(
  "lp_snapshots",
  {
    id: uuid().primaryKey().defaultRandom(),
    puuid: text().notNull(),
    queueId: integer("queue_id").notNull(), // 420=Solo/Duo, 440=Flex
    tier: text().notNull(),
    division: text().notNull(),
    leaguePoints: integer("league_points").notNull(),
    // Absolute ladder value (tierToLP) for charting/peak comparison.
    value: integer().notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_lp_puuid_queue_time").on(t.puuid, t.queueId, t.recordedAt)]
)

export type LpSnapshot = typeof lpSnapshots.$inferSelect
export type NewLpSnapshot = typeof lpSnapshots.$inferInsert
