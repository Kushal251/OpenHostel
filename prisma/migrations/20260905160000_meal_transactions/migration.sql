CREATE TABLE "MealTransaction" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealWindowId" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "servedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MealTransaction_messId_userId_mealWindowId_serviceDate_key" ON "MealTransaction"("messId", "userId", "mealWindowId", "serviceDate");
CREATE INDEX "MealTransaction_messId_servedAt_idx" ON "MealTransaction"("messId", "servedAt");
ALTER TABLE "MealTransaction" ADD CONSTRAINT "MealTransaction_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealTransaction" ADD CONSTRAINT "MealTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealTransaction" ADD CONSTRAINT "MealTransaction_mealWindowId_fkey" FOREIGN KEY ("mealWindowId") REFERENCES "MealWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
