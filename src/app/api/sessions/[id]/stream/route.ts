import { subscribe } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          /* Verbindung geschlossen */
        }
      }
      unsubscribe = subscribe(id, send)
      if (!unsubscribe) {
        send(`event: error\ndata: ${JSON.stringify({ error: 'Session unbekannt' })}\n\n`)
        controller.close()
        return
      }
      // Heartbeat, damit Proxys/Browser die Verbindung offen halten
      const beat = setInterval(() => send(': ping\n\n'), 20000)
      ;(controller as any)._beat = beat
    },
    cancel(reason) {
      unsubscribe?.()
      const beat = (this as any)?._beat
      if (beat) clearInterval(beat)
      void reason
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
