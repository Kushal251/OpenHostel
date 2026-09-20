CREATE TABLE "DailyMessPassValidation" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyMessPassValidation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyMessPassValidation_messId_userId_serviceDate_key"
  ON "DailyMessPassValidation"("messId", "userId", "serviceDate");
CREATE INDEX "DailyMessPassValidation_passId_idx"
  ON "DailyMessPassValidation"("passId");

ALTER TABLE "DailyMessPassValidation"
  ADD CONSTRAINT "DailyMessPassValidation_messId_fkey"
  FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMessPassValidation"
  ADD CONSTRAINT "DailyMessPassValidation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMessPassValidation"
  ADD CONSTRAINT "DailyMessPassValidation_passId_fkey"
  FOREIGN KEY ("passId") REFERENCES "MessPassRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
