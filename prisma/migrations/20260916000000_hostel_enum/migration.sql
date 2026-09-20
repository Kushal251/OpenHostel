-- CSA is currently the only supported hostel. Normalize older free-text values
-- before converting the columns to the application enum.
CREATE TYPE "Hostel" AS ENUM ('CSA');

UPDATE "User" SET "hostel" = 'CSA' WHERE "hostel" IS NOT NULL AND "hostel" <> 'CSA';
UPDATE "Mess" SET "hostel" = 'CSA' WHERE "hostel" <> 'CSA';

ALTER TABLE "User"
  ALTER COLUMN "hostel" TYPE "Hostel" USING "hostel"::"Hostel";

ALTER TABLE "Mess"
  ALTER COLUMN "hostel" TYPE "Hostel" USING "hostel"::"Hostel";
