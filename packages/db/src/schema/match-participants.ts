import { bigint, boolean, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core"
import { matches } from "./matches"

// Stores all participants for each indexed match.
// Critical for the "previously played with/against" feature.
export const matchParticipants = pgTable(
  "match_participants",
  {
    id: uuid().primaryKey().defaultRandom(),
    matchId: text("match_id").references(() => matches.matchId),
    puuid: text().notNull(),
    gameName: text("game_name"),
    tagLine: text("tag_line"),
    teamId: integer("team_id"), // 100=blue, 200=red
    championName: text("champion_name"),
    win: boolean(),
    gameCreation: bigint("game_creation", { mode: "number" }),
  },
  (t) => [
    index("idx_mp_match_id").on(t.matchId),
    index("idx_mp_puuid").on(t.puuid),
    index("idx_mp_match_puuid").on(t.matchId, t.puuid),
  ]
)

export type MatchParticipant = typeof matchParticipants.$inferSelect
export type NewMatchParticipant = typeof matchParticipants.$inferInsert
