import { NextResponse } from 'next/server'
import { listRuns } from '@/lib/transcripts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get('limit') ?? 120)
  return NextResponse.json({ runs: await listRuns(Number.isFinite(limit) ? limit : 120) })
}
