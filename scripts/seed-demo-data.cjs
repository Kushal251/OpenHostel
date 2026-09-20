require("dotenv/config");

const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");

const DEMO_PASSWORD = "DemoPass123!";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 30_000,
});

const demoUsers = [
  {
    username: "DEMO-MESS-MANAGER",
    email: "mess.manager@demo.openhostel.test",
    role: "MESS_MANAGER",
    status: "ACTIVE",
    firstName: "Mia",
    lastName: "Sharma",
    phone: "9876543210",
    uniqueId: "DEMO-MANAGER-001",
    branch: "Food Services",
    enrollmentNo: null,
  },
  {
    username: "STU-DEMO2026001",
    email: "aarav.patel@demo.openhostel.test",
    role: "STUDENT",
    status: "ACTIVE",
    firstName: "Aarav",
    lastName: "Patel",
    phone: "9876543211",
    uniqueId: null,
    branch: "Computer Science",
    enrollmentNo: "DEMO2026001",
  },
  {
    username: "STU-DEMO2026002",
    email: "riya.verma@demo.openhostel.test",
    role: "STUDENT",
    status: "PENDING",
    firstName: "Riya",
    lastName: "Verma",
    phone: "9876543212",
    uniqueId: null,
    branch: "Information Technology",
    enrollmentNo: "DEMO2026002",
  },
  {
    username: "STU-DEMO2026003",
    email: "kabir.khan@demo.openhostel.test",
    role: "STUDENT",
    status: "PENDING",
    firstName: "Kabir",
    lastName: "Khan",
    phone: "9876543213",
    uniqueId: null,
    branch: "Electronics Engineering",
    enrollmentNo: "DEMO2026003",
  },
  {
    username: "STU-DEMO2026004",
    email: "sneha.iyer@demo.openhostel.test",
    role: "STUDENT",
    status: "PENDING",
    firstName: "Sneha",
    lastName: "Iyer",
    phone: "9876543214",
    uniqueId: null,
    branch: "Mechanical Engineering",
    enrollmentNo: "DEMO2026004",
  },
];

async function upsertDemoUser(client, user, passwordHash) {
  const result = await client.query(
    `INSERT INTO "User" (
      "id", "username", "email", "passwordHash", "role", "status",
      "firstName", "lastName", "phone", "uniqueId", "college", "branch",
      "hostel", "passingYear", "enrollmentNo", "roomNumber", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'UIT RGPV', $11,
      'CSA'::"Hostel", 2026, $12, $13, NOW()
    )
    ON CONFLICT ("email") DO UPDATE SET
      "username" = EXCLUDED."username",
      "passwordHash" = EXCLUDED."passwordHash",
      "role" = EXCLUDED."role",
      "status" = EXCLUDED."status",
      "firstName" = EXCLUDED."firstName",
      "lastName" = EXCLUDED."lastName",
      "phone" = EXCLUDED."phone",
      "uniqueId" = EXCLUDED."uniqueId",
      "college" = EXCLUDED."college",
      "branch" = EXCLUDED."branch",
      "hostel" = EXCLUDED."hostel",
      "passingYear" = EXCLUDED."passingYear",
      "enrollmentNo" = EXCLUDED."enrollmentNo",
      "roomNumber" = EXCLUDED."roomNumber",
      "updatedAt" = NOW()
    RETURNING "id"`,
    [
      randomUUID(),
      user.username,
      user.email,
      passwordHash,
      user.role,
      user.status,
      user.firstName,
      user.lastName,
      user.phone,
      user.uniqueId,
      user.branch,
      user.enrollmentNo,
      user.role === "STUDENT" ? "C-101" : null,
    ],
  );
  return result.rows[0].id;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const ids = {};
    for (const user of demoUsers) ids[user.email] = await upsertDemoUser(client, user, passwordHash);

    const managerId = ids["mess.manager@demo.openhostel.test"];
    const existingMess = await client.query(
      'SELECT "id" FROM "Mess" WHERE "hostel" = \'CSA\'::"Hostel"',
    );
    let messId = existingMess.rows[0]?.id;
    let createdMess = false;
    if (!messId) {
      const created = await client.query(
        `INSERT INTO "Mess" (
          "id", "name", "hostel", "phoneNumbers", "email", "about", "managerId", "updatedAt"
        ) VALUES ($1, $2, 'CSA'::"Hostel", $3, $4, $5, $6, NOW()) RETURNING "id"`,
        [
          randomUUID(),
          "CSA Community Mess",
          ["9876543210", "9876543215"],
          "mess@demo.openhostel.test",
          "A demo mess with daily meal windows and sample pass applications.",
          managerId,
        ],
      );
      messId = created.rows[0].id;
      createdMess = true;
    }

    const windows = await client.query('SELECT "id" FROM "MealWindow" WHERE "messId" = $1 LIMIT 1', [messId]);
    if (!windows.rowCount) {
      await client.query(
        `INSERT INTO "MealWindow" ("id", "messId", "label", "startTime", "endTime", "sortOrder") VALUES
          ($1, $2, 'Breakfast', '07:30', '09:30', 0),
          ($3, $2, 'Lunch', '12:30', '14:30', 1),
          ($4, $2, 'Dinner', '19:30', '21:30', 2)`,
        [randomUUID(), messId, randomUUID(), randomUUID()],
      );
    }

    const offerResult = await client.query(
      'SELECT "id" FROM "MessPassOffer" WHERE "messId" = $1 AND "title" = $2 LIMIT 1',
      [messId, "Demo 30-Day Mess Pass"],
    );
    let offerId = offerResult.rows[0]?.id;
    if (!offerId) {
      const createdOffer = await client.query(
        `INSERT INTO "MessPassOffer" ("id", "messId", "title", "days", "price", "active", "sortOrder", "updatedAt")
         VALUES ($1, $2, $3, 30, 3000, TRUE, 0, NOW()) RETURNING "id"`,
        [randomUUID(), messId, "Demo 30-Day Mess Pass"],
      );
      offerId = createdOffer.rows[0].id;
    }

    const activeStudentId = ids["aarav.patel@demo.openhostel.test"];
    const pendingStudentId = ids["riya.verma@demo.openhostel.test"];
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() - 5);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 25);

    const activePass = await client.query(
      'SELECT "id" FROM "MessPassRequest" WHERE "messId" = $1 AND "userId" = $2 AND "status" = \'ACTIVE\' LIMIT 1',
      [messId, activeStudentId],
    );
    if (activePass.rowCount) {
      await client.query(
        `UPDATE "MessPassRequest" SET "offerId" = $1, "requestedDays" = 30, "requestedPrice" = 3000,
          "finalDays" = 30, "finalAmount" = 3000, "startsAt" = $2, "expiresAt" = $3,
          "approvedById" = $4, "approvedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $5`,
        [offerId, startsAt, expiresAt, managerId, activePass.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO "MessPassRequest" (
          "id", "messId", "userId", "offerId", "requestedDays", "requestedPrice", "status",
          "finalDays", "finalAmount", "startsAt", "expiresAt", "approvedById", "approvedAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, 30, 3000, 'ACTIVE', 30, 3000, $5, $6, $7, NOW(), NOW())`,
        [randomUUID(), messId, activeStudentId, offerId, startsAt, expiresAt, managerId],
      );
    }

    const pendingPass = await client.query(
      'SELECT "id" FROM "MessPassRequest" WHERE "messId" = $1 AND "userId" = $2 AND "status" = \'PENDING\' LIMIT 1',
      [messId, pendingStudentId],
    );
    if (!pendingPass.rowCount) {
      await client.query(
        `INSERT INTO "MessPassRequest" (
          "id", "messId", "userId", "offerId", "requestedDays", "requestedPrice", "status", "updatedAt"
        ) VALUES ($1, $2, $3, $4, 30, 3000, 'PENDING', NOW())`,
        [randomUUID(), messId, pendingStudentId, offerId],
      );
    }

    await client.query("COMMIT");
    console.log(JSON.stringify({
      mess: createdMess ? "created" : "reused existing CSA mess",
      users: demoUsers.length,
      pendingStudentApplications: 3,
      messPassApplications: { active: 1, pending: 1 },
      demoPassword: DEMO_PASSWORD,
    }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exitCode = 1;
});
