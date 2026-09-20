CREATE TABLE "DailyMealWindow" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "mealWindowId" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMealWindow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyMealWindow_mealWindowId_serviceDate_key" ON "DailyMealWindow"("mealWindowId", "serviceDate");
CREATE INDEX "DailyMealWindow_messId_serviceDate_idx" ON "DailyMealWindow"("messId", "serviceDate");

ALTER TABLE "DailyMealWindow" ADD CONSTRAINT "DailyMealWindow_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMealWindow" ADD CONSTRAINT "DailyMealWindow_mealWindowId_fkey" FOREIGN KEY ("mealWindowId") REFERENCES "MealWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
