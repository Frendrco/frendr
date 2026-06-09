-- Phase 2: Drop the old isPublic column
-- Runs automatically via `prisma migrate deploy` in the Vercel build command.
-- Safe because new code no longer reads isPublic.

ALTER TABLE "Video" DROP COLUMN "isPublic";
