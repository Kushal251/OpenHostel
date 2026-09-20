ALTER TABLE "User"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "uniqueId" TEXT,
  ADD COLUMN "photoUrl" TEXT,
  ADD COLUMN "college" TEXT,
  ADD COLUMN "branch" TEXT,
  ADD COLUMN "hostel" TEXT,
  ADD COLUMN "passingYear" INTEGER,
  ADD COLUMN "enrollmentNo" TEXT,
  ADD COLUMN "roomNumber" TEXT,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "temporaryPassword" TEXT,
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT;

CREATE UNIQUE INDEX "User_uniqueId_key" ON "User"("uniqueId");
CREATE UNIQUE INDEX "User_enrollmentNo_key" ON "User"("enrollmentNo");
