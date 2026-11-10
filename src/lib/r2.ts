import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { prisma } from '@/src/lib/db';
export { MAX_PHOTO_BYTES, PHOTO_TYPES } from '@/src/lib/photo-validation';

export class PhotoStorageError extends Error {}

export function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_URL;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicDomain) {
    throw new PhotoStorageError('Photo uploads are not configured here. You can save a round without a photo.');
  }
  return {
    bucket, publicDomain: publicDomain.replace(/\/$/, ''),
    client: new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, maxAttempts: 2 }),
  };
}

export function managedPhotoKey(url: string) {
  const photo = new URL(url);
  for (const domain of [process.env.R2_PUBLIC_DOMAIN, process.env.R2_PUBLIC_URL].filter(Boolean)) {
    const base = new URL(domain!);
    const prefix = `${base.pathname.replace(/\/$/, '')}/rounds/`;
    if (photo.origin === base.origin && photo.pathname.startsWith(prefix)) {
      const key = decodeURIComponent(photo.pathname.slice(base.pathname.replace(/\/$/, '').length + 1));
      if (key.includes('..') || key.includes('\\') || photo.search || photo.hash) return null;
      return key;
    }
  }
  return null;
}

export async function uploadRoundPhoto(file: File) {
  const { client, bucket, publicDomain } = r2Config();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-100) || 'photo';
  const key = `rounds/${crypto.randomUUID()}_${cleanName}`;
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type, CacheControl: 'public, max-age=31536000, immutable' }));
  } catch {
    throw new PhotoStorageError('Could not upload the photo to storage. Your existing photo has not been changed. Try again.');
  }
  return `${publicDomain}/${key}`;
}

export async function cleanupPhoto(url: string) {
  const key = managedPhotoKey(url);
  // Other matches may share a photo; external image hosts are never deleted.
  if (key && await prisma.game.count({ where: { imageUrl: url } }) === 0) {
    const { client, bucket } = r2Config();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
  await prisma.imageCleanup.deleteMany({ where: { url } });
}

export async function retryPhotoCleanup() {
  const pending = await prisma.imageCleanup.findMany({ orderBy: { createdAt: 'asc' }, take: 100 });
  for (const { url } of pending) {
    try { await cleanupPhoto(url); }
    catch (error) { console.error('Photo cleanup deferred:', error instanceof Error ? error.name : 'Storage error'); }
  }
  return prisma.imageCleanup.count();
}
