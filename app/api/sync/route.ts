import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/db';
import { databaseError } from '@/src/lib/database-error';
import { cleanupPhoto, MAX_PHOTO_BYTES, PHOTO_TYPES, PhotoStorageError, uploadRoundPhoto } from '@/src/lib/r2';

export const dynamic = 'force-dynamic';

class InputError extends Error {}

function text(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 160) {
    throw new InputError(`${label} is required and must be 160 characters or fewer.`);
  }
  return value.trim();
}

function players(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw new InputError('Enter between 1 and 8 players.');
  }
  const names = value.map(name => text(name, 'Player name'));
  if (new Set(names.map(name => name.toLowerCase())).size !== names.length) {
    throw new InputError('Each player needs a different name.');
  }
  return names;
}

function pars(value: unknown): number[] {
  if (!Array.isArray(value) || ![9, 18].includes(value.length) ||
      value.some(par => ![3, 4, 5].includes(par))) {
    throw new InputError('Enter par 3, 4, or 5 for exactly 9 or 18 holes.');
  }
  return value;
}

async function bodyOf(request: Request) {
  let body;
  let photo: File | undefined;
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData();
      body = JSON.parse(String(form.get('record')));
      const image = form.get('photo');
      if (image instanceof File) photo = image;
    } else { body = await request.json(); }
  } catch { throw new InputError('Send a valid record.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Send a valid record.');
  if (photo && (!PHOTO_TYPES.includes(photo.type) || !photo.size || photo.size > MAX_PHOTO_BYTES)) {
    throw new InputError('Choose a JPG, PNG, WebP, GIF, AVIF, or HEIC photo up to 10 MB.');
  }
  return { body: body as Record<string, unknown>, photo };
}

function entityOf(value: unknown) {
  if (value === undefined || value === 'game') return 'game';
  if (value === 'course' || value === 'group') return value;
  throw new InputError('Choose a match, course, or player group.');
}

function failure(error: unknown) {
  if (error instanceof PhotoStorageError) return NextResponse.json({ error: error.message }, { status: 503 });
  if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'This record no longer exists. Refresh and try again.' }, { status: 404 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'That name is already in use. Choose another name.' }, { status: 409 });
    if (error.code === 'P2003') return NextResponse.json({ error: 'This course is used by saved matches. Keep it, or remove those matches first.' }, { status: 409 });
  }
  console.error('Database request failed:', error);
  return NextResponse.json(databaseError(error, !!process.env.DATABASE_URL?.trim()), { status: 503 });
}

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      const game = await prisma.game.findUnique({ where: { id }, include: { course: true } });
      if (!game) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
      return NextResponse.json({ game });
    }
    const [games, courses, groups, pendingPhotoCleanup] = await prisma.$transaction([
      prisma.game.findMany({ orderBy: { date: 'desc' }, include: { course: true } }),
      prisma.course.findMany({ orderBy: { name: 'asc' } }),
      prisma.groupTemplate.findMany({ orderBy: { name: 'asc' } }),
      prisma.imageCleanup.count(),
    ]);
    return NextResponse.json({ games, courses, groups, pendingPhotoCleanup });
  } catch (error) { return failure(error); }
}

async function save(request: Request, editing: boolean) {
  let uploadedPhoto: string | undefined;
  try {
    const { body, photo } = await bodyOf(request);
    const entity = entityOf(body.entity);
    const id = editing ? text(body.id, 'Record ID') : undefined;
    if (entity === 'course') {
      const data = { name: text(body.name, 'Course name'), pars: pars(body.pars) };
      const course = editing
        ? await prisma.$transaction(async tx => {
            const original = await tx.course.findUniqueOrThrow({ where: { id } });
            // Older matches predate snapshots; preserve their pars before changing the template.
            await tx.game.updateMany({ where: { courseId: id, coursePars: { isEmpty: true } }, data: { coursePars: original.pars } });
            return tx.course.update({ where: { id }, data });
          })
        : await prisma.course.create({ data });
      return NextResponse.json({ course }, { status: editing ? 200 : 201 });
    }
    if (entity === 'group') {
      const data = { name: text(body.name, 'Group name'), players: players(body.players) };
      const group = editing
        ? await prisma.groupTemplate.update({ where: { id }, data })
        : await prisma.groupTemplate.create({ data });
      return NextResponse.json({ group }, { status: editing ? 200 : 201 });
    }

    const roster = players(body.players);
    const totalHoles = body.totalHoles;
    if (totalHoles !== 9 && totalHoles !== 18) throw new InputError('Choose 9 or 18 holes.');
    const startingLoop = body.startingLoop ?? 'Front';
    if (startingLoop !== 'Front' && startingLoop !== 'Back') throw new InputError('Choose the front or back nine.');
    const date = new Date(text(body.date, 'Match date'));
    if (Number.isNaN(date.getTime())) throw new InputError('Enter a valid match date.');
    const scores = body.scoresJson;
    if (!scores || typeof scores !== 'object' || Array.isArray(scores)) throw new InputError('Enter valid hole scores.');
    const validHoles = Array.from({ length: totalHoles }, (_, i) => ((startingLoop === 'Back' ? 9 : 0) + i) % 18 + 1);
    for (const [hole, values] of Object.entries(scores)) {
      if (!validHoles.some(n => String(n) === hole) || !Array.isArray(values) || values.length !== roster.length ||
          values.some(score => !Number.isInteger(score) || score < 0 || score > 99)) {
        throw new InputError('Each played hole needs a score from 0 to 99 for every player. Use 0 for an unplayed hole.');
      }
    }
    let imageUrl: string | null | undefined = body.imageUrl === undefined ? undefined : null;
    if (body.imageUrl) {
      if (typeof body.imageUrl !== 'string' || body.imageUrl.length > 2048) throw new InputError('Enter a valid image URL.');
      try {
        const url = new URL(body.imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        imageUrl = url.href;
      } catch { throw new InputError('Image URL must start with http:// or https://.'); }
    }
    if (photo) imageUrl = uploadedPhoto = await uploadRoundPhoto(photo);
    let previousPhoto: string | null = null;
    const game = await prisma.$transaction(async tx => {
      let course = typeof body.courseId === 'string'
        ? await tx.course.findUnique({ where: { id: body.courseId } }) : null;
      if (!course) {
        if (editing) throw new InputError('Choose an existing course.');
        const name = text(body.courseName, 'Course name');
        const coursePars = pars(body.coursePars);
        course = await tx.course.upsert({ where: { name }, update: {}, create: { name, pars: coursePars } });
      }
      const coursePars = body.coursePars ? pars(body.coursePars) : course.pars;
      if ((totalHoles === 18 || startingLoop === 'Back') && coursePars.length < 18) {
        throw new InputError('Choose an 18-hole course for this round configuration.');
      }
      const data = {
        date, courseId: course.id, totalHoles, startingLoop, coursePars,
        players: roster, scoresJson: scores as Prisma.InputJsonObject, imageUrl,
      };
      if (editing) {
        const original = await tx.game.findUniqueOrThrow({ where: { id } });
        const updated = await tx.game.update({ where: { id }, data, include: { course: true } });
        if (original.imageUrl && original.imageUrl !== updated.imageUrl) {
          previousPhoto = original.imageUrl;
          await tx.imageCleanup.upsert({ where: { url: previousPhoto }, create: { url: previousPhoto }, update: {} });
        }
        return updated;
      }
      const createId = body.id === undefined ? crypto.randomUUID() : text(body.id, 'Match ID');
      const existing = await tx.game.findUnique({ where: { id: createId }, include: { course: true } });
      if (existing) {
        if (uploadedPhoto && uploadedPhoto !== existing.imageUrl) {
          previousPhoto = uploadedPhoto;
          await tx.imageCleanup.upsert({ where: { url: uploadedPhoto }, create: { url: uploadedPhoto }, update: {} });
        }
        return existing;
      }
      return tx.game.create({ data: { ...data, id: createId }, include: { course: true } });
    });
    if (previousPhoto) {
      try { await cleanupPhoto(previousPhoto); } catch { /* The saved cleanup task can be retried from history. */ }
    }
    return NextResponse.json({ game, pendingPhotoCleanup: await prisma.imageCleanup.count() }, { status: editing ? 200 : 201 });
  } catch (error) {
    if (uploadedPhoto) {
      try {
        await prisma.imageCleanup.upsert({ where: { url: uploadedPhoto }, create: { url: uploadedPhoto }, update: {} });
        await cleanupPhoto(uploadedPhoto);
      } catch { console.error('Unused upload cleanup deferred.'); }
    }
    return failure(error);
  }
}

export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }

export async function DELETE(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const entity = entityOf(params.get('entity') ?? undefined);
    const id = text(params.get('id'), 'Record ID');
    if (entity === 'game') {
      const removed = await prisma.$transaction(async tx => {
        const game = await tx.game.delete({ where: { id } });
        if (game.imageUrl) await tx.imageCleanup.upsert({ where: { url: game.imageUrl }, create: { url: game.imageUrl }, update: {} });
        return game;
      });
      if (removed.imageUrl) {
        try { await cleanupPhoto(removed.imageUrl); } catch { /* Keep the cleanup task for retry. */ }
      }
    }
    if (entity === 'course') await prisma.course.delete({ where: { id } });
    if (entity === 'group') await prisma.groupTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true, pendingPhotoCleanup: await prisma.imageCleanup.count() });
  } catch (error) { return failure(error); }
}
