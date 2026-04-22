/**
 * Prisma Client singleton instance
 */
import { PrismaClient } from '@prisma/client';

const STATEMENT_TIMEOUT_MS = 30_000;

function withStatementTimeout(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    const existing = url.searchParams.get('options') || '';
    if (existing.includes('statement_timeout')) return rawUrl;
    const merged = `${existing} -c statement_timeout=${STATEMENT_TIMEOUT_MS}`.trim();
    url.searchParams.set('options', merged);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: { url: withStatementTimeout(process.env.DATABASE_URL) },
  },
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;