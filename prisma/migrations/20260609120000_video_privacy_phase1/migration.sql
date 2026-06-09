-- Phase 1: Additive only — safe to run while old code is live
-- Adds new privacy columns and backfills from isPublic.
-- Does NOT drop isPublic so existing code continues to work.

-- Create the visibility enum
CREATE TYPE "VideoVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE');

-- Add new columns alongside isPublic
ALTER TABLE "Video"
  ADD COLUMN "visibility"    "VideoVisibility" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "password"      TEXT,
  ADD COLUMN "hideFromFeeds" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "allowComments" BOOLEAN NOT NULL DEFAULT true;

-- Backfill visibility from isPublic before any code reads it
UPDATE "Video"
SET "visibility" = CASE
  WHEN "isPublic" = true THEN 'PUBLIC'::"VideoVisibility"
  ELSE 'PRIVATE'::"VideoVisibility"
END;

-- Replace the old composite index
DROP INDEX IF EXISTS "Video_videoType_isPublic_idx";
CREATE INDEX "Video_videoType_visibility_idx" ON "Video"("videoType", "visibility");
