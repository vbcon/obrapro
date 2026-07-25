import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VBCON Engenharia',
  description: 'Gestão de obras com visibilidade total — qualidade, transparência e planejamento.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
