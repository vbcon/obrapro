'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Papel } from '@/lib/types/roles'
import {
  Building2, HardHat, CalendarDays, ShoppingCart,
  MessageCircle, LogOut, ChevronRight, LayoutDashboard,
  Settings, BookOpen, DollarSign, Users,
} from 'lucide-react'

// Definição de quais módulos cada papel pode ver
const NAV_TODOS = [
  { label: 'Dashboard',      href: '/dashboard',            icon: LayoutDashboard, exact: true, papeis: ['admin','cliente','arquiteto'] },
  { label: 'Obras',          href: '/dashboard/obras',      icon: HardHat,         papeis: ['admin','cliente'] },
  { label: 'Compras',        href: '/dashboard/compras',    icon: ShoppingCart,    papeis: ['admin','cliente'] },
  { label: 'Financeiro',     href: '/dashboard/financeiro', icon: DollarSign,      papeis: ['admin','cliente'] },
  { label: 'Cronograma',     href: '/dashboard/cronograma', icon: CalendarDays,    papeis: ['admin','cliente','arquiteto'] },
  { label: 'Status da Obra', href: '/dashboard/diario',     icon: BookOpen,        papeis: ['admin','cliente','arquiteto'] },
  { label: 'WhatsApp',       href: '/dashboard/whatsapp',   icon: MessageCircle,   papeis: ['admin'] },
]

const NAV_SISTEMA = [
  { label: 'Usuários',       href: '/dashboard/configuracoes/usuarios', icon: Users,    papeis: ['admin'] },
  { label: 'Configurações',  href: '/dashboard/configuracoes',          icon: Settings, papeis: ['admin','cliente','arquiteto'], exact: true },
]

const PAPEL_BADGE: Record<Papel, { label: string; cor: string }> = {
  admin:     { label: 'Admin',     cor: 'bg-brand-500/20 text-brand-400' },
  cliente:   { label: 'Cliente',   cor: 'bg-blue-500/20 text-blue-400' },
  arquiteto: { label: 'Arquiteto', cor: 'bg-purple-500/20 text-purple-400' },
}

interface SidebarProps {
  nomeUsuario?: string
  emailUsuario?: string
  papel: Papel
}

export default function Sidebar({ nomeUsuario, emailUsuario, papel }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navVisiveis = NAV_TODOS.filter(item => item.papeis.includes(papel))
  const sistemaPapeis = NAV_SISTEMA.filter(item => item.papeis.includes(papel))
  const badge = PAPEL_BADGE[papel] || PAPEL_BADGE.admin

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-lead-900 border-r border-lead-800">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-lead-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-500 shadow-md shadow-brand-500/20 shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">
            OBRA<span className="text-brand-400">PRO</span>
          </span>
          <p className="text-[10px] text-lead-500 leading-none mt-0.5">Gestão de Obras</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-lead-500 uppercase tracking-widest mb-2 mt-1">
          Menu Principal
        </p>

        {navVisiveis.map(item => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/20'
                  : 'text-lead-400 hover:bg-lead-800 hover:text-lead-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-400' : 'text-lead-500 group-hover:text-lead-300'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400/60" />}
            </Link>
          )
        })}

        {sistemaPapeis.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-[10px] font-semibold text-lead-500 uppercase tracking-widest mb-2">Sistema</p>
            {sistemaPapeis.map(item => {
              const active = isActive(item.href, item.exact)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/20'
                      : 'text-lead-400 hover:bg-lead-800 hover:text-lead-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-400' : 'text-lead-500 group-hover:text-lead-300'}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400/60" />}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Perfil */}
      <div className="border-t border-lead-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
            {nomeUsuario?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-lead-200 truncate">{nomeUsuario || 'Usuário'}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.cor} shrink-0`}>{badge.label}</span>
            </div>
            <p className="text-xs text-lead-500 truncate">{emailUsuario || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="p-1.5 rounded-md text-lead-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
