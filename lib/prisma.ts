import { PrismaClient as PostgresClient } from '@prisma/client';
import { PrismaClient as SqliteClient } from '../generated/sqlite-client';
import { PrismaClient as MysqlClient } from '../generated/mysql-client';

type AnyClient = PostgresClient;

// Internal global cache for clients
const globalForClients = global as unknown as { __prismaClients?: Record<string, AnyClient> };

// Provider is determined only by environment variables for stability.
// Global mutation via file is disabled to prevent race conditions.
export const getDbProvider = () => {
  return (process.env.DB_PROVIDER || 'postgres').toLowerCase();
};

export function setDbProvider(provider: string) {
  // Runtime switching is disabled for stability.
  // Use DB_PROVIDER environment variable to change the database.
  console.warn('setDbProvider is deprecated and disabled. Use DB_PROVIDER env instead.');
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
