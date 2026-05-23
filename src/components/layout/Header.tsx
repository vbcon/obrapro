'use client'

import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  titulo: string
  subtitulo?: string
}

export default function Header({ titulo, subtitulo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white border-b border-lead-200 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-lead-900">{titulo}</h1>
        {subtitulo && <p className="text-xs text-lead-500">{subtitulo}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Busca rápida */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-lead-400" />
          <input
            type="search"
            placeholder="Buscar..."
            className="w-56 rounded-lg border border-lead-200 bg-lead-50 pl-9 pr-3 py-2 text-sm text-lead-700 placeholder:text-lead-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Notificações */}
        <button className="relative p-2 rounded-lg text-lead-500 hover:text-lead-700 hover:bg-lead-100 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
        </button>
      </div>
    </header>
  )
}
