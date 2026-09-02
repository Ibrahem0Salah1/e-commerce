-- migrations/add-two-factor-lock-fields/migration.sql

ALTER TABLE "two_factors" ADD COLUMN IF NOT EXISTS "failedVerificationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "two_factors" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);