import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";

// Ensure WAL mode and proper timeout for high concurrency with the scraper
const libsql = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Configure connection pragmas for resilient SQLite performance
if (!url.startsWith('libsql://') && !url.startsWith('https://')) {
    try {
        libsql.execute("PRAGMA journal_mode = WAL;").catch(e => console.warn(e));
        libsql.execute("PRAGMA synchronous = NORMAL;").catch(e => console.warn(e));
        libsql.execute("PRAGMA busy_timeout = 5000;").catch(e => console.warn(e));
    } catch (e) {
        console.warn("Could not set SQLite PRAGMAs (might be ignored if using Turso HTTP):", e);
    }
}

const adapter = new PrismaLibSQL(libsql);

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    // log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
