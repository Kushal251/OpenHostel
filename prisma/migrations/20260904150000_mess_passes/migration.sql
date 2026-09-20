CREATE TABLE "MessPassOffer" (
  "id" TEXT NOT NULL, "messId" TEXT NOT NULL, "title" TEXT NOT NULL, "days" INTEGER NOT NULL, "price" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MessPassOffer_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MessPassRequest" (
  "id" TEXT NOT NULL, "messId" TEXT NOT NULL, "userId" TEXT NOT NULL, "offerId" TEXT, "requestedDays" INTEGER NOT NULL,
  "requestedPrice" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "finalDays" INTEGER, "finalAmount" INTEGER,
  "startsAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "approvedById" TEXT, "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MessPassRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MessPassOffer_messId_idx" ON "MessPassOffer"("messId");
CREATE INDEX "MessPassRequest_messId_status_idx" ON "MessPassRequest"("messId", "status");
CREATE INDEX "MessPassRequest_userId_status_idx" ON "MessPassRequest"("userId", "status");
ALTER TABLE "MessPassOffer" ADD CONSTRAINT "MessPassOffer_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessPassRequest" ADD CONSTRAINT "MessPassRequest_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessPassRequest" ADD CONSTRAINT "MessPassRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessPassRequest" ADD CONSTRAINT "MessPassRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "MessPassOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessPassRequest" ADD CONSTRAINT "MessPassRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
