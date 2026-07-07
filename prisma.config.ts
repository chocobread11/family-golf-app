import 'dotenv/config'; // Must be the first import to load env parameters
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Direct Prisma to your custom schema location
  schema: 'prisma/schema.prisma',
  
  // Configure the database connection string for CLI commands
  datasource: {
    url: env('DATABASE_URL'),
  },

  // Tells Prisma 7 how to find your seed file
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
});