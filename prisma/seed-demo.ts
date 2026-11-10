import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = new URL(process.env.DATABASE_URL ?? '');
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '55432' || url.pathname !== '/family_golf') {
  throw new Error('Demo rounds can only be seeded into the local Docker database on port 55432.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });

try {
  const course = await prisma.course.findUniqueOrThrow({ where: { name: 'Amverton Cove Golf Resort' } });
  for (const [index, startingLoop] of ['Front', 'Back'].entries()) {
    const date = new Date();
    date.setDate(date.getDate() - index - 1);
    const scoresJson = Object.fromEntries(Array.from({ length: 9 }, (_, i) => {
      const hole = i + (startingLoop === 'Back' ? 10 : 1);
      const par = course.pars[hole - 1];
      return [String(hole), [par, par + (i % 3 === 0 ? 1 : 0), par + 1, par + (i % 2)]];
    }));
    await prisma.game.upsert({
      where: { id: `local-demo-${startingLoop.toLowerCase()}` }, update: {},
      create: { id: `local-demo-${startingLoop.toLowerCase()}`, date, courseId: course.id, totalHoles: 9, startingLoop, coursePars: course.pars, players: ['Ayah', 'Luqman', 'Abang', 'Umar'], scoresJson },
    });
  }
  console.log('Two demo rounds are ready in the local Docker database. Edit or delete them in Saved Matches.');
} finally { await prisma.$disconnect(); }
