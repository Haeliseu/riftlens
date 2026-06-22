ALTER TABLE "profiles" ADD COLUMN "riot_puuid" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "game_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "tag_line" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_refreshed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_riot_puuid_unique" UNIQUE("riot_puuid");