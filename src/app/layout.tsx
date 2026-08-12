import type { Metadata } from 'next'
import '@phosphor-icons/web/regular'
import './nocturne.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fleet Console',
  description: 'Lokale Agenten-Konsole für Claude Code',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
