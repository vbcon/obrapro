import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OBRAPRO - Gestão de Obras',
  description: 'Sistema profissional de gestão de obras e projetos de construção',
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
