CREATE TABLE "match_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" text,
	"puuid" text NOT NULL,
	"game_name" text,
	"tag_line" text,
	"team_id" integer,
	"champion_name" text,
	"win" boolean,
	"game_creation" bigint
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"match_id" text PRIMARY KEY NOT NULL,
	"region" text NOT NULL,
	"game_mode" text,
	"game_type" text,
	"game_duration" integer,
	"game_creation" bigint,
	"patch" text,
	"raw_data" jsonb,
	"processed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rune_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"champion_id" integer,
	"champion_name" text,
	"name" text NOT NULL,
	"primary_style_id" integer,
	"sub_style_id" integer,
	"selected_perk_ids" integer[],
	"stat_shards" integer[],
	"source" text DEFAULT 'manual',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "summoner_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puuid" text NOT NULL,
	"match_id" text,
	"champion_id" integer,
	"champion_name" text,
	"kills" integer,
	"deaths" integer,
	"assists" integer,
	"win" boolean,
	"role" text,
	"lane" text,
	"gold_earned" integer,
	"total_damage_dealt" integer,
	"vision_score" integer,
	"cs_per_min" real,
	"kill_participation" real,
	"game_creation" bigint,
	"team_id" integer,
	"rift_score" real
);
--> statement-breakpoint
CREATE TABLE "summoners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"puuid" text NOT NULL,
	"game_name" text NOT NULL,
	"tag_line" text NOT NULL,
	"summoner_id" text,
	"account_id" text,
	"profile_icon_id" integer,
	"summoner_level" integer,
	"region" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"last_updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "summoners_puuid_unique" UNIQUE("puuid")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text,
	"avatar_url" text,
	"default_region" text DEFAULT 'EUW1',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_id_matches_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rune_pages" ADD CONSTRAINT "rune_pages_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summoner_matches" ADD CONSTRAINT "summoner_matches_match_id_matches_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summoners" ADD CONSTRAINT "summoners_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mp_match_id" ON "match_participants" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_mp_puuid" ON "match_participants" USING btree ("puuid");--> statement-breakpoint
CREATE INDEX "idx_mp_match_puuid" ON "match_participants" USING btree ("match_id","puuid");--> statement-breakpoint
CREATE INDEX "idx_sm_puuid" ON "summoner_matches" USING btree ("puuid");--> statement-breakpoint
CREATE INDEX "idx_sm_game_creation" ON "summoner_matches" USING btree ("game_creation");--> statement-breakpoint
CREATE INDEX "idx_sm_champion" ON "summoner_matches" USING btree ("puuid","champion_name");--> statement-breakpoint
CREATE INDEX "idx_sm_match" ON "summoner_matches" USING btree ("match_id");