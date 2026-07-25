'use client'

import { Search, Menu } from 'lucide-react'
import { useSidebar } from '@/lib/context/SidebarContext'

interface HeaderProps {
  titulo: string
  subtitulo?: string
}

export default function Header({ titulo, subtitulo }: HeaderProps) {
  const { open } = useSidebar()

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-lead-100"
      style={{ height: 'var(--header-height)' }}
    >
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={open}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-lead-500 hover:bg-lead-100 hover:text-lead-800 transition-colors shrink-0"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] font-semibold text-lead-900 leading-snug truncate">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-xs text-lead-400 leading-none mt-0.5 truncate">{subtitulo}</p>
        )}
      </div>

      {/* Search — desktop only */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="hidden md:flex items-center gap-2 h-8 rounded-lg border border-lead-200 bg-lead-50/80
                     pl-3 pr-2 text-xs text-lead-400
                     hover:border-lead-300 hover:bg-white hover:text-lead-600
                     transition-all duration-150 group"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="w-24 text-left">Buscar...</span>
          <kbd className="inline-flex items-center gap-px rounded border border-lead-200 bg-white
                         px-1.5 py-0.5 text-[10px] font-mono text-lead-400
                         shadow-[0_1px_1px_rgba(0,0,0,0.06)]
                         group-hover:border-lead-300 transition-colors">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  )
}
