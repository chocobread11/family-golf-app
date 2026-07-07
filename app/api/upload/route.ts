import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Hardcoded matching parameters based on your configuration token snapshots
const accountId = "04b9cefa17aa6645752db5e69635d80b";
const bucketName = "golf-image";

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "27e9b68100504f598be61f414e95b4f2",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "f4934ba2461303351488628ff3bc6cc5d67f413a7b24cd5dc0bf5a2c153c1d10",
  },
});

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    // Sanitize filename to fallback cleanly if special characters are present
    const cleanName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `rounds/${Date.now()}_${cleanName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    // Generate the presigned secure upload token valid for 5 minutes
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    // ✨ FIXED: Uses your absolute public access dev domain safely, falling back directly to your verified subdomain path
    const baseDomain = process.env.R2_PUBLIC_DOMAIN || "https://pub-4237ea1575694e2fa537c5be9983de9c.r2.dev";
    const publicUrl = `${baseDomain}/${fileKey}`;

return NextResponse.json({ uploadUrl, publicUrl }, { status: 200 });

    return NextResponse.json({ uploadUrl, publicUrl }, { status: 200 });
  } catch (error) {
    console.error('❌ R2 signing link generation failure:', error);
    return NextResponse.json({ error: 'Failed to sign storage endpoint' }, { status: 500 });
  }
}