import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  uuid,
} from "drizzle-orm/pg-core"
import { matches } from "./matches"

export const summonerMatches = pgTable(
  "summoner_matches",
  {
    id: uuid().primaryKey().defaultRandom(),
    puuid: text().notNull(),
    matchId: text("match_id").references(() => matches.matchId),
    championId: integer("champion_id"),
    championName: text("champion_name"),
    kills: integer(),
    deaths: integer(),
    assists: integer(),
    win: boolean(),
    role: text(),
    lane: text(),
    goldEarned: integer("gold_earned"),
    totalDamageDealt: integer("total_damage_dealt"),
    visionScore: integer("vision_score"),
    csPerMin: real("cs_per_min"),
    killParticipation: real("kill_participation"),
    gameCreation: bigint("game_creation", { mode: "number" }),
    teamId: integer("team_id"), // 100=blue, 200=red
    riftScore: real("rift_score"),
  },
  (t) => [
    index("idx_sm_puuid").on(t.puuid),
    index("idx_sm_game_creation").on(t.gameCreation),
    index("idx_sm_champion").on(t.puuid, t.championName),
    index("idx_sm_match").on(t.matchId),
  ]
)

export type SummonerMatch = typeof summonerMatches.$inferSelect
export type NewSummonerMatch = typeof summonerMatches.$inferInsert
