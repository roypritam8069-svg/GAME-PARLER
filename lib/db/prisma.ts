import { PrismaClient } from "@prisma/client";

/**
 * Shared server-side Prisma client.
 *
 * Database access must stay server-side (ARCHITECTURE.md §3).
 * The client is cached on `globalThis` in development so that Next.js
 * hot reloads do not open a new connection pool on every reload.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
