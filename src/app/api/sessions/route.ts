import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import { listSessions, startSession } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ sessions: await listSessions() })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })

  const project = String(body.project ?? '').trim()
  const prompt = String(body.prompt ?? '').trim()
  const model = String(body.model ?? 'sonnet').trim()
  const roles: string[] = Array.isArray(body.roles) ? body.roles.map(String).filter(Boolean) : []
  const skipPermissions = Boolean(body.skipPermissions)

  // Validate inputs
  if (!prompt) return NextResponse.json({ error: 'Prompt fehlt' }, { status: 400 })
  if (prompt.length > 10000) {
    return NextResponse.json({ error: 'Prompt zu lang (max 10000 Zeichen)' }, { status: 400 })
  }
  if (!project) return NextResponse.json({ error: 'Projektpfad fehlt' }, { status: 400 })
  if (project.includes('..') || project.startsWith('~')) {
    return NextResponse.json({ error: 'Ungültiger Projektpfad' }, { status: 400 })
  }
  if (roles.length > 20) {
    return NextResponse.json({ error: 'Zu viele Rollen (max 20)' }, { status: 400 })
  }

  try {
    const stat = await fs.stat(project)
    if (!stat.isDirectory()) throw new Error('kein Verzeichnis')
  } catch {
    return NextResponse.json({ error: `Projektordner nicht gefunden: ${project}` }, { status: 400 })
  }

  const state = startSession({ project, model, roles, prompt, skipPermissions })
  return NextResponse.json({ session: state })
}
