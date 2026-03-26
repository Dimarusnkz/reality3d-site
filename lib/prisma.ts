import { PrismaClient as PostgresClient } from '@prisma/client';
import { PrismaClient as SqliteClient } from '../generated/sqlite-client';
import { PrismaClient as MysqlClient } from '../generated/mysql-client';
import { cache } from 'react';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

type AnyClient = PostgresClient;

const PROVIDER_FILE = '.db_provider';

// Internal global cache for clients
const globalForClients = global as unknown as { __prismaClients?: Record<string, AnyClient> };

export const getDbProvider = cache(() => {
  // Edge runtime doesn't support fs. If we're in Edge, we must fallback to env.
  // Next.js defines process.env.NEXT_RUNTIME
  if (process.env.NEXT_RUNTIME === 'edge') {
    return (process.env.DB_PROVIDER || 'postgres').toLowerCase();
  }

  // 1. Check if file exists
  if (existsSync(PROVIDER_FILE)) {
    try {
      return readFileSync(PROVIDER_FILE, 'utf8').trim().toLowerCase();
    } catch (e) {
      console.error('Failed to read .db_provider:', e);
    }
  }
  // 2. Fallback to env or default
  return (process.env.DB_PROVIDER || 'postgres').toLowerCase();
});

export function setDbProvider(provider: string) {
  try {
    writeFileSync(PROVIDER_FILE, provider.toLowerCase(), 'utf8');
  } catch (e) {
    console.error('Failed to write .db_provider:', e);
  }
}

function makeClient(provider: string): AnyClient {
  const url =
    provider === 'sqlite'
      ? process.env.DATABASE_URL_SQLITE
      : provider === 'mysql'
        ? process.env.DATABASE_URL_MYSQL
        : process.env.DATABASE_URL;

  if (provider === 'sqlite') {
    const client = url ? new SqliteClient({ datasources: { db: { url } } }) : new SqliteClient();
    return client as unknown as AnyClient;
  }

  if (provider === 'mysql') {
    const client = url ? new MysqlClient({ datasources: { db: { url } } }) : new MysqlClient();
    return client as unknown as AnyClient;
  }

  const client = url ? new PostgresClient({ datasources: { db: { url } } }) : new PostgresClient();
  return client;
}

export function getPrisma(): AnyClient {
  const provider = getDbProvider();
  if (!globalForClients.__prismaClients) {
    globalForClients.__prismaClients = {};
  }
  const existing = globalForClients.__prismaClients[provider];
  if (existing) return existing;
  const created = makeClient(provider);
  globalForClients.__prismaClients[provider] = created;
  return created;
}

export const prisma: AnyClient = getPrisma();
