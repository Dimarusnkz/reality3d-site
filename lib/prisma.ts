import { PrismaClient as PostgresClient } from '@prisma/client';
import { PrismaClient as SqliteClient } from '../generated/sqlite-client';
import { PrismaClient as MysqlClient } from '../generated/mysql-client';

import { cookies } from 'next/headers';

type AnyClient = PostgresClient;

const globalForClients = global as unknown as { __prismaClients?: Record<string, AnyClient> };

export function getDbProvider() {
  try {
    const cookieStore = cookies();
    const provider = cookieStore.get('db_provider')?.value;
    if (provider) return provider.toLowerCase();
  } catch {
    // cookies() might fail in some contexts (e.g. build time or outside request)
  }
  return (process.env.DB_PROVIDER || 'postgres').toLowerCase();
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
