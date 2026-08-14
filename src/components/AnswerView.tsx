'use client'

import { useLayoutEffect, useRef } from 'react'
import { fmtTime } from '@/lib/types'

/**
 * Minimaler Markdown-Renderer für das, was Claude tatsächlich schreibt:
 * Überschriften, Listen, Codeblöcke, fett, `code`. Bewusst ohne Bibliothek und
 * ohne `dangerouslySetInnerHTML` — der Text kann aus fremden Dateien stammen,
 * deshalb wird nichts als HTML interpretiert.
 */
function inline(text: string, key: string) {
  // **fett** und `code` auszeichnen, alles andere bleibt Text
  const teile = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return teile.map((teil, i) => {
    if (teil.startsWith('**') && teil.endsWith('**')) {
      return (
        <strong key={`${key}-${i}`} style={{ fontWeight: 600, color: 'var(--color-text)' }}>
          {teil.slice(2, -2)}
        </strong>
      )
    }
    if (teil.startsWith('`') && teil.endsWith('`') && teil.length > 2) {
      return (
        <code
          key={`${key}-${i}`}
          style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: '0.92em',
            background: 'rgba(233,233,237,.07)',
            borderRadius: 4,
            padding: '1px 5px',
            color: 'var(--color-accent-300)',
          }}
        >
          {teil.slice(1, -1)}
        </code>
      )
    }
    return <span key={`${key}-${i}`}>{teil}</span>
  })
}

function Markdown({ text }: { text: string }) {
  const zeilen = text.split('\n')
  const blocks: React.ReactNode[] = []
  let liste: string[] = []
  let code: string[] | null = null

  const listeSchliessen = () => {
    if (!liste.length) return
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        style={{
          margin: '6px 0 10px',
          paddingLeft: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {liste.map((l, i) => (
          <li key={i} style={{ lineHeight: 1.6 }}>
            {inline(l, `li-${blocks.length}-${i}`)}
          </li>
        ))}
      </ul>
    )
    liste = []
  }

  zeilen.forEach((zeile, index) => {
    if (zeile.trim().startsWith('```')) {
      if (code === null) {
        listeSchliessen()
        code = []
      } else {
        blocks.push(
          <pre
            key={`pre-${index}`}
            style={{
              background: '#101120',
              border: '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 11.5,
              lineHeight: 1.6,
              overflowX: 'auto',
              margin: '8px 0 12px',
              color: 'var(--color-neutral-300)',
            }}
          >
            {code.join('\n')}
          </pre>
        )
        code = null
      }
      return
    }
    if (code !== null) {
      code.push(zeile)
      return
    }

    const ueberschrift = zeile.match(/^(#{1,4})\s+(.*)$/)
    if (ueberschrift) {
      listeSchliessen()
      const stufe = ueberschrift[1].length
      blocks.push(
        <div
          key={`h-${index}`}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: stufe <= 1 ? 18 : stufe === 2 ? 16 : 14,
            margin: blocks.length ? '16px 0 6px' : '0 0 6px',
          }}
        >
          {inline(ueberschrift[2], `h-${index}`)}
        </div>
      )
      return
    }

    const punkt = zeile.match(/^\s*[-*•]\s+(.*)$/) || zeile.match(/^\s*\d+\.\s+(.*)$/)
    if (punkt) {
      liste.push(punkt[1])
      return
    }

    if (!zeile.trim()) {
      listeSchliessen()
      return
    }

    listeSchliessen()
    blocks.push(
      <p key={`p-${index}`} style={{ margin: '0 0 10px', lineHeight: 1.65 }}>
        {inline(zeile, `p-${index}`)}
      </p>
    )
  })
  listeSchliessen()

  return <>{blocks}</>
}

export default function AnswerView({ antworten }: { antworten: { t: string; text: string }[] }) {
  const box = useRef<HTMLDivElement>(null)
  const letzte = useRef<HTMLDivElement>(null)
  const anzahl = antworten.length

  /**
   * Beim Öffnen der Ansicht (und bei jeder neuen Antwort) steht die *neueste*
   * im Bild — nicht die älteste. Der Wechsel von „Rollen" auf „Antwort" hängt
   * die Ansicht neu ein, sie stünde sonst jedes Mal wieder ganz oben.
   * `useLayoutEffect`, damit der Sprung vor dem ersten Bild passiert.
   */
  useLayoutEffect(() => {
    const b = box.current
    const l = letzte.current
    if (!b || !l) return
    // Passt die letzte Antwort ganz ins Bild, ans Ende scrollen; ist sie
    // länger, an ihren Anfang — sonst landet man mitten im Text.
    const passt = l.offsetHeight <= b.clientHeight
    b.scrollTop = passt ? b.scrollHeight : Math.max(0, l.offsetTop - 12)
  }, [anzahl])

  if (!antworten.length) {
    return (
      <div
        className="stage"
        style={{
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-neutral-600)',
          fontSize: 13,
        }}
      >
        Noch keine Antwort.
      </div>
    )
  }

  return (
    <div
      className="stage"
      ref={box}
      style={{
        overflowY: 'auto',
        padding: '18px 22px',
        fontSize: 13.5,
        color: 'var(--color-neutral-200)',
      }}
    >
      {antworten.map((a, i) => (
        <div
          key={i}
          ref={i === antworten.length - 1 ? letzte : undefined}
          style={{ marginBottom: i === antworten.length - 1 ? 0 : 26 }}
        >
          <div
            className="kicker"
            style={{
              marginBottom: 8,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              position: 'sticky',
              top: -18,
              background: 'var(--color-bg)',
              paddingTop: 4,
            }}
          >
            Antwort {i + 1} · {fmtTime(a.t)}
            <button
              className="btn btn-ghost"
              style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px' }}
              onClick={() => navigator.clipboard?.writeText(a.text)}
            >
              <i className="ph ph-copy" /> kopieren
            </button>
          </div>
          <div style={{ maxWidth: 780 }}>
            <Markdown text={a.text} />
          </div>
        </div>
      ))}
    </div>
  )
}
