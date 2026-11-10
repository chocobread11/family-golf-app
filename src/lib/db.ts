import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  golfDatabase?: { url: string | undefined; client: PrismaClient };
};
const url = process.env.DATABASE_URL;

export const prisma = globalForPrisma.golfDatabase?.url === url && globalForPrisma.golfDatabase
  ? globalForPrisma.golfDatabase.client
  : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

if (process.env.NODE_ENV !== 'production') globalForPrisma.golfDatabase = { url, client: prisma };
