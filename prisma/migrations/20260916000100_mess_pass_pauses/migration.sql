ALTER TABLE "MessPassRequest"
  ADD COLUMN "pauseStartedAt" TIMESTAMP(3),
  ADD COLUMN "pauseEndsAt" TIMESTAMP(3),
  ADD COLUMN "pauseOriginalExpiresAt" TIMESTAMP(3),
  ADD COLUMN "pausePlannedDays" INTEGER;

CREATE INDEX "MessPassRequest_pauseEndsAt_idx" ON "MessPassRequest"("pauseEndsAt");
