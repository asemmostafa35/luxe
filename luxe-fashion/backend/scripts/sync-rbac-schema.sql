-- Sync Role enum + store_settings (safe to re-run)
-- Usage: npx prisma db execute --file scripts/sync-rbac-schema.sql

DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE 'VIEWER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE 'EDITOR';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL DEFAULT 'ZANE',
    "contactEmail" TEXT NOT NULL DEFAULT 'hello@zanefashion.com',
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT true,
    "activeAnnouncementId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "store_settings" ("id", "storeName", "contactEmail", "announcementEnabled", "updatedAt")
VALUES ('default', 'ZANE', 'hello@zanefashion.com', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
