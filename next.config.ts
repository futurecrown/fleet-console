import type { NextConfig } from 'next'

// Lokales Werkzeug: bindet bewusst nur an localhost (siehe README).
const nextConfig: NextConfig = {
  reactStrictMode: false, // sonst doppelte SSE-Verbindungen im Dev-Modus
  serverExternalPackages: [],
}

export default nextConfig
