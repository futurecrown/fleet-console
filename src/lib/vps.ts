import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { VPS_ENABLED, VPS_HOST } from './config'

const exec = promisify(execFile)

/** Marker, an dem die Konsole ihre eigenen Cron-Zeilen erkennt. Alles ohne
 *  diesen Marker wird nie angefasst — fremde Cronjobs bleiben unberührt. */
const MARK = '# fleet-console:'

export interface NightRun {
  name: string
  schedule: string
  command: string
  line: string
}

export interface VpsStatus {
  enabled: boolean
  host: string
  connected: boolean
  error: string | null
  runs: NightRun[]
  otherLines: number
  lastRun: string | null
  claudeVersion: string | null
}

async function ssh(command: string, timeout = 12000): Promise<string> {
  const { stdout } = await exec(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=accept-new', VPS_HOST, command],
    { timeout, maxBuffer: 1024 * 1024 },
  )
  return stdout
}

function parseCrontab(raw: string): { runs: NightRun[]; other: string[] } {
  const runs: NightRun[] = []
  const other: string[] = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    const idx = line.indexOf(MARK)
    if (idx === -1) {
      other.push(line)
      continue
    }
    const name = line.slice(idx + MARK.length).trim()
    const body = line.slice(0, idx).trim()
    const parts = body.split(/\s+/)
    runs.push({
      name,
      schedule: parts.slice(0, 5).join(' '),
      command: parts.slice(5).join(' '),
      line,
    })
  }
  return { runs, other }
}

export async function getVpsStatus(): Promise<VpsStatus> {
  const base: VpsStatus = {
    enabled: VPS_ENABLED,
    host: VPS_HOST,
    connected: false,
    error: null,
    runs: [],
    otherLines: 0,
    lastRun: null,
    claudeVersion: null,
  }
  if (!VPS_ENABLED) return base

  try {
    const raw = await ssh('crontab -l 2>/dev/null || true')
    const { runs, other } = parseCrontab(raw)
    base.connected = true
    base.runs = runs
    base.otherLines = other.filter((l) => !l.startsWith('#')).length
  } catch (err: any) {
    base.error = err?.stderr?.trim() || err?.message || 'SSH fehlgeschlagen'
    return base
  }

  // Zusatzinfos dürfen fehlschlagen, ohne den Status zu kippen
  try {
    base.claudeVersion = (await ssh('claude --version 2>/dev/null || echo "nicht installiert"')).trim()
  } catch {
    /* egal */
  }
  try {
    base.lastRun = (await ssh('tail -n 1 /opt/ivan/fleet/last-run.log 2>/dev/null || true')).trim() || null
  } catch {
    /* egal */
  }
  return base
}

/** Ersetzt alle markierten Zeilen durch die übergebenen; fremde Zeilen bleiben. */
export async function saveNightRuns(runs: { name: string; schedule: string; command: string }[]): Promise<void> {
  const raw = await ssh('crontab -l 2>/dev/null || true')
  const { other } = parseCrontab(raw)

  for (const r of runs) {
    if (!/^[\w.:-]+$/.test(r.name)) throw new Error(`Ungültiger Name: ${r.name}`)
    if (!/^[\d*/,\s-]+$/.test(r.schedule) || r.schedule.trim().split(/\s+/).length !== 5) {
      throw new Error(`Ungültiger Zeitplan: ${r.schedule}`)
    }
    // Nur `\n` zu prüfen reicht nicht: ein einzelnes `\r` beendet die Zeile in
    // der Crontab ebenfalls, damit ließe sich eine zweite, beliebige Zeile
    // einschleusen (CWE-93). Ebenso wenig dürfen Steuerzeichen oder der
    // Markerkommentar selbst im Befehl stehen — sonst lässt sich eine fremde
    // Zeile als „von der Konsole verwaltet" ausgeben.
    if (/[\r\n\u0000-\u001f\u007f]/.test(r.command)) {
      throw new Error('Befehl darf keine Zeilenumbrüche oder Steuerzeichen enthalten')
    }
    if (r.command.includes(MARK)) throw new Error('Befehl darf den Verwaltungsmarker nicht enthalten')
    if (r.command.trim().length === 0) throw new Error('Befehl ist leer')
    if (r.command.length > 500) throw new Error('Befehl ist zu lang')
    // Der Zeitplan geht durch dieselbe Prüfung — `\r` ist in `\s` enthalten.
    if (/[\r\n]/.test(r.schedule) || /[\r\n]/.test(r.name)) {
      throw new Error('Zeitplan und Name dürfen keine Zeilenumbrüche enthalten')
    }
  }

  const lines = [
    ...other,
    ...runs.map((r) => `${r.schedule.trim()} ${r.command.trim()} ${MARK}${r.name}`),
  ]
  const body = lines.join('\n').replace(/\n+$/, '') + '\n'

  // Über stdin schreiben, damit nichts durch die Shell muss
  await new Promise<void>((resolve, reject) => {
    const child = execFile(
      'ssh',
      ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', VPS_HOST, 'crontab -'],
      { timeout: 12000 },
      (err) => (err ? reject(err) : resolve()),
    )
    child.stdin?.end(body)
  })
}

/** Vorlage für einen Nachtlauf, wie ihn das Mockup zeigt. */
export function nightRunTemplate(project = '/opt/ivan/fleet/workspace'): string {
  return (
    `cd ${project} && /usr/local/bin/claude -p "@orchestrator: Nachtlauf" ` +
    `--model sonnet --output-format text >> /opt/ivan/fleet/reports/nacht-$(date +\\%F).md 2>&1`
  )
}
