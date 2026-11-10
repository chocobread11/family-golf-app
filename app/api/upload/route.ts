import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { retryPhotoCleanup } from '@/src/lib/r2';

export async function POST(request: Request) {
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const baseDomain = process.env.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_URL;
    if (!accountId || !bucketName || !accessKeyId || !secretAccessKey || !baseDomain) {
      return NextResponse.json({ error: 'Photo uploads are not configured here. You can start a round without a photo.' }, { status: 503 });
    }
    const r2Client = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    const { filename, contentType } = await request.json();

    if (typeof filename !== 'string' || typeof contentType !== 'string' || !filename || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    const cleanName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `rounds/${Date.now()}_${cleanName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    // Generate the presigned secure upload token valid for 5 minutes
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    const publicUrl = `${baseDomain.replace(/\/$/, '')}/${fileKey}`;

    return NextResponse.json({ uploadUrl, publicUrl }, { status: 200 });
  } catch (error) {
    console.error('❌ R2 signing link generation failure:', error);
    return NextResponse.json({ 
      error: 'Failed to sign storage endpoint',
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const pendingPhotoCleanup = await retryPhotoCleanup();
    return NextResponse.json({ pendingPhotoCleanup });
  } catch {
    return NextResponse.json({ error: 'Could not finish photo cleanup. Your saved matches are safe. Try again.' }, { status: 503 });
  }
}
