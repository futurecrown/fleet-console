import { NextResponse } from 'next/server'
import { MODELS, PIPELINE_MODEL, ROLE_TIMEOUT_SEC } from '@/lib/config'
import { listProjects, listRoles } from '@/lib/settings'
import { listSessions, PRUEFAUFTRAG } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const [projects, roles, sessions] = await Promise.all([listProjects(), listRoles(), listSessions()])
  return NextResponse.json({
    projects,
    roles,
    models: MODELS,
    sessions: sessions.slice(0, 20),
    pipeline: { standardAuftrag: PRUEFAUFTRAG, standardModell: PIPELINE_MODEL, timeoutSec: ROLE_TIMEOUT_SEC },
  })
}
