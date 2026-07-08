import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/family_golf?schema=public";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Executing family database seed operations...");

  // ⚠️ FIX: Removed .deleteMany({}) to protect live match history entries from relational constraint drops.

  // --- 1. GROUP TEMPLATE SEEDS (Fixed mismatch where name properties clashed) ---
  await prisma.groupTemplate.upsert({
    where: { name: 'Full Flight' },
    update: {},
    create: {
      name: 'Full Flight',
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

  await prisma.groupTemplate.upsert({
    where: { name: 'Duo Saja' },
    update: {},
    create: {
      name: 'Duo Saja',
      players: ['Golfer 1', 'Golfer 2'],
    },
  });

  // --- 2. 18-HOLE COURSE TEMPLATE SEEDS (Upserts update existing or append safely) ---
  await prisma.course.upsert({
    where: { name: 'Saujana Impian Golf Club' },
    update: {
      pars: [
        4, 3, 5, 4, 5, 4, 3, 4, 4,
        4, 4, 3, 4, 5, 4, 3, 5, 4
      ]
    },
    create: {
      name: 'Saujana Impian Golf Club',
      pars: [
        4, 3, 5, 4, 5, 4, 3, 4, 4,
        4, 4, 3, 4, 5, 4, 3, 5, 4
      ],
    },
  });

  await prisma.course.upsert({
    where: { name: 'Berjaya Hills Golf & Country Club' },
    update: {
      pars: [
        4, 4, 5, 4, 3, 4, 4, 3, 5,
        5, 4, 4, 3, 4, 4, 3, 4, 5
      ]
    },
    create: {
      name: 'Berjaya Hills Golf & Country Club',
      pars: [
        4, 4, 5, 4, 3, 4, 4, 3, 5,
        5, 4, 4, 3, 4, 4, 3, 4, 5
      ],
    },
  });

  await prisma.course.upsert({
    where: { name: 'Bangi Golf Resort' },
    update: {
      pars: [
        4, 4, 5, 3, 4, 4, 3, 5, 4,
        4, 4, 3, 5, 4, 4, 5, 3, 4
      ]
    },
    create: {
      name: 'Bangi Golf Resort',
      pars: [
        4, 4, 5, 3, 4, 4, 3, 5, 4,
        4, 4, 3, 5, 4, 4, 5, 3, 4
      ],
    },
  });

  await prisma.course.upsert({
    where: { name: 'Amverton Cove Golf Resort' },
    update: {
      pars: [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4]
    },
    create: {
      name: 'Amverton Cove Golf Resort',
      pars: [4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    },
  });

  await prisma.course.upsert({
    where: { name: 'Kinrara Golf Club' },
    update: {
      pars: [4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4]
    },
    create: {
      name: 'Kinrara Golf Club',
      pars: [4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4],
    },
  });

  await prisma.course.upsert({
    where: { name: 'Bukit Beruntung Golf Resort' },
    update: {
      pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4]
    },
    create: {
      name: 'Bukit Beruntung Golf Resort',
      pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4],
    },
  });

  await prisma.course.upsert({
    where: { name: 'Glenmarie Golf & Country Club' },
    update: {
      pars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4]
    },
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
    await pool.end();
  });