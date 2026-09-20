CREATE TABLE "Mess" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hostel" TEXT NOT NULL,
  "menuImageUrl" TEXT,
  "phoneNumbers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "email" TEXT,
  "about" TEXT,
  "managerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Mess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealWindow" (
  "id" TEXT NOT NULL,
  "messId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MealWindow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessStaff" (
  "id" TEXT NOT NULL,
  "messId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessStaff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Mess_hostel_key" ON "Mess"("hostel");
CREATE UNIQUE INDEX "MessStaff_messId_userId_key" ON "MessStaff"("messId", "userId");
ALTER TABLE "Mess" ADD CONSTRAINT "Mess_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealWindow" ADD CONSTRAINT "MealWindow_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessStaff" ADD CONSTRAINT "MessStaff_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessStaff" ADD CONSTRAINT "MessStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
