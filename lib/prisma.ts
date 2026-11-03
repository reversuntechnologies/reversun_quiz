import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import fs from "node:fs";

if (!process.env.DATABASE_URL) {
  if (fs.existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  } else if (fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/reversun_quiz?schema=public";

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
