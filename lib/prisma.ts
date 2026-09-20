import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { pgPool?: Pool; prisma?: ReturnType<typeof createPrisma> };

function isTransientConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  return /connection terminated|connection timeout|timeout exceeded when trying to connect|destination stream closed|connection.*closed|ECONNRESET|P1017|P1001|can't reach database server|database not reachable|ENOTFOUND|EAI_AGAIN/i.test(
    `${code} ${message}`,
  );
}

function createPrisma() {
  const pool = globalForPrisma.pgPool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon pools connections on its side. This pool only absorbs concurrent
    // application queries and keeps connections alive long enough to avoid
    // reconnecting for every cache revalidation.
    max: 5,
    idleTimeoutMillis: 30_000,
    // A sleeping Neon compute can take longer than ten seconds to accept a
    // secure connection. Keep this below the request timeout, but high enough
    // to allow a normal wake-up rather than failing every home-page query.
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
  });
  globalForPrisma.pgPool = pool;
  // An idle Neon connection can be closed remotely. Listening prevents pg from
  // turning that expected pool event into an unhandled process-level error.
  pool.on("error", () => undefined);
  const client = new PrismaClient({ adapter: new PrismaPg(pool) });
  return client.$extends({ query: { $allModels: { async $allOperations({ args, query }) {
    let lastError: unknown;
    for (const delay of [0, 250, 750, 1_500]) {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      try {
        return await query(args);
      } catch (error) {
        if (!isTransientConnectionError(error)) throw error;
        lastError = error;
      }
    }
    throw lastError;
  } } } });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
