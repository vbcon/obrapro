import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VBCON Engenharia',
  description: 'Gestão de obras com visibilidade total — qualidade, transparência e planejamento.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VBCON" />
        <meta name="theme-color" content="#1e3a5f" />
      </head>
      <body>{children}</body>
    </html>
  )
}
