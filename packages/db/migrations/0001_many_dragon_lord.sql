CREATE TABLE "lp_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puuid" text NOT NULL,
	"queue_id" integer NOT NULL,
	"tier" text NOT NULL,
	"division" text NOT NULL,
	"league_points" integer NOT NULL,
	"value" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rank_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puuid" text NOT NULL,
	"season" text NOT NULL,
	"queue_id" integer NOT NULL,
	"tier" text NOT NULL,
	"division" text NOT NULL,
	"league_points" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "summoner_matches" ADD COLUMN "queue_id" integer;--> statement-breakpoint
ALTER TABLE "summoners" ADD COLUMN "solo_tier" text;--> statement-breakpoint
ALTER TABLE "summoners" ADD COLUMN "solo_division" text;--> statement-breakpoint
ALTER TABLE "summoners" ADD COLUMN "solo_league_points" integer;--> statement-breakpoint
ALTER TABLE "summoners" ADD COLUMN "rank_checked_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_lp_puuid_queue_time" ON "lp_snapshots" USING btree ("puuid","queue_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_rh_puuid_season_queue" ON "rank_history" USING btree ("puuid","season","queue_id");--> statement-breakpoint
CREATE INDEX "idx_rh_puuid" ON "rank_history" USING btree ("puuid");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_sm_puuid_match" ON "summoner_matches" USING btree ("puuid","match_id");