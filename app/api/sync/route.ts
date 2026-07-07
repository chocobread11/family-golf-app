import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/family_golf?schema=public";

// Global singletons to prevent breaking connection limits during Next.js local dev reloads
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pool: pg.Pool };
const pool = globalForPrisma.pool || new pg.Pool({ connectionString });
if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic'; // Ensures database is queried live on production URLs

export async function GET() {
  // ... rest of your sync code remains exactly the same
  try {
    // 1. Fetch all game records including their linked course metadata
    const games = await prisma.game.findMany({
      orderBy: { date: 'desc' },
      include: { course: true }
    });

    // 2. Fetch all raw course templates 
    const courses = await prisma.course.findMany({
      orderBy: { name: 'asc' }
    });

    // 3. ✨ FIXED: Changed from 'group' to 'groupTemplate' to match your exact schema model name
    const groups = await prisma.groupTemplate.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Return all collections cleanly wrapped in a single JSON payload object
    return NextResponse.json({ games, courses, groups }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to fetch structural history/templates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- POST: Save Completed/Aborted Game Card ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      date, 
      courseId, 
      courseName, 
      coursePars, 
      totalHoles, 
      players, 
      scoresJson, 
      imageUrl 
    } = body;

    // Baseline structural verification
    if (!players || !scoresJson) {
      return NextResponse.json({ error: "Missing required round metrics" }, { status: 400 });
    }

    // Resolve Foreign Key Constraint layout rules safely
    let finalCourseId = courseId;
    if (!finalCourseId || finalCourseId === 'demo' || finalCourseId === 'default' || finalCourseId.startsWith('c_')) {
      const nameToRegister = courseName || "Saujana Impian Golf Club";
      const parsToRegister = coursePars && coursePars.length > 0 ? coursePars : [4, 4, 3, 5, 4, 3, 4, 4, 5];

      // Upsert to match by layout name to prevent constraint duplication errors
      const verifiedCourse = await prisma.course.upsert({
        where: { name: nameToRegister },
        update: {},
        create: { name: nameToRegister, pars: parsToRegister }
      });
      finalCourseId = verifiedCourse.id;
    }

    // Handle structural safety fallbacks for dynamic client ids
    if (finalCourseId.startsWith('c_')) {
      const fallbackCourse = await prisma.course.findFirst();
      if (fallbackCourse) {
        finalCourseId = fallbackCourse.id;
      }
    }

    // Persist your match entry along with the R2 media link string
    const savedGame = await prisma.game.create({
      data: {
        id: id?.startsWith('game_') ? undefined : id, 
        date: date ? new Date(date) : new Date(),
        courseId: finalCourseId,
        totalHoles: Number(totalHoles),
        players,
        scoresJson, 
        imageUrl: imageUrl || null, // Saves the Cloudflare public reference link directly
      },
    });

    // Clean up types and send data
    return NextResponse.json({ success: true, game: savedGame }, { status: 201 });
  } catch (error) {
    console.error("❌ Database sync write failure:", error);
    return NextResponse.json({ error: "Failed to write score record", details: String(error) }, { status: 500 });
  }
}