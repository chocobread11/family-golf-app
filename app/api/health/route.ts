import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Liveness only: optional storage or a database outage must not hide a running app.
export function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
