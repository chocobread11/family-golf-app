import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Setup connection string context matching your setup parameters
const connectionString = process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/family_golf?schema=public";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Pass the adapter directly to the Prisma Client constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Executing family database seed operations...');

  // 1. Inject Core Family group combination template snapshot
  await prisma.groupTemplate.upsert({
    where: { name: 'Core Family' },
    update: {},
    create: {
      name: 'Core Family',
      players: ['Ayah', 'Luqman', 'Abang', 'Umar'],
    },
  });

  await prisma.groupTemplate.upsert({
    where: { name: 'Trio Amverton' },
    update: {},
    create: {
      name: 'Trio Amverton',
      players: ['Ayah', 'Luqman', 'Umar'],
    },
  });

  // 2. Inject baseline course profile configuration layout (Original 9-hole snapshot)
  await prisma.course.upsert({
    where: { name: 'Saujana Impian Golf Club' },
    update: {},
    create: {
      name: 'Saujana Impian Golf Club',
      pars: [4, 4, 3, 5, 4, 3, 4, 4, 5],
    },
  });

  // 3. Amverton Cove Golf & Island Resort (18 Holes - Par 72)
  await prisma.course.upsert({
    where: { name: 'Amverton Cove Golf Resort' },
    update: {},
    create: {
      name: 'Amverton Cove Golf Resort',
      pars: [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    },
  });

  // 4. Kinrara Golf Club (18 Holes - Par 72)
  await prisma.course.upsert({
    where: { name: 'Kinrara Golf Club' },
    update: {},
    create: {
      name: 'Kinrara Golf Club',
      pars: [4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4],
    },
  });

  // 5. Bukit Beruntung Golf & Country Resort (18 Holes - Par 72)
  await prisma.course.upsert({
    where: { name: 'Bukit Beruntung Golf Resort' },
    update: {},
    create: {
      name: 'Bukit Beruntung Golf Resort',
      pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4],
    },
  });

  // 6. Glenmarie Golf & Country Club - Garden Course (18 Holes - Par 72)
  await prisma.course.upsert({
    where: { name: 'Glenmarie Golf & Country Club' },
    update: {},
    create: {
      name: 'Glenmarie Golf & Country Club',
      pars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    },
  });

  console.log('✓ Seeding sequence operations executed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failure encountered:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Safely teardown open active sockets
  });