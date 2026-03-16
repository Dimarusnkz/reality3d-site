import { PrismaClient as PostgresClient } from '@prisma/client';
import { PrismaClient as SqliteClient } from '../generated/sqlite-client';
import { PrismaClient as MysqlClient } from '../generated/mysql-client';

type AnyClient = PostgresClient | SqliteClient | MysqlClient;

const globalForPrisma = global as unknown as { prisma: AnyClient | undefined };

function makeClient() {
  const provider = (process.env.DB_PROVIDER || 'postgres').toLowerCase();
  const url =
    provider === 'sqlite'
      ? process.env.DATABASE_URL_SQLITE
      : provider === 'mysql'
        ? process.env.DATABASE_URL_MYSQL
        : process.env.DATABASE_URL;

  const Client = provider === 'sqlite' ? SqliteClient : provider === 'mysql' ? MysqlClient : PostgresClient;
  if (!url) return new Client() as AnyClient;
  return new Client({ datasources: { db: { url } } }) as AnyClient;
}

export const prisma = globalForPrisma.prisma || makeClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
