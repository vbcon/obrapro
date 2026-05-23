'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Building2,
  HardHat,
  CalendarDays,
  ShoppingCart,
  MessageCircle,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Obras',
    href: '/dashboard/obras',
    icon: HardHat,
  },
  {
    label: 'Cronograma',
    href: '/dashboard/cronograma',
    icon: CalendarDays,
  },
  {
    label: 'Compras',
    href: '/dashboard/compras',
    icon: ShoppingCart,
  },
  {
    label: 'WhatsApp',
    href: '/dashboard/whatsapp',
    icon: MessageCircle,
  },
]

interface SidebarProps {
  nomeUsuario?: string
  emailUsuario?: string
}

export default function Sidebar({ nomeUsuario, emailUsuario }: SidebarProps) {
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
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="px-3 text-[10px] font-semibold text-lead-500 uppercase tracking-widest mb-2 mt-1">
          Menu Principal
        </p>

        {navItems.map(item => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/20'
                  : 'text-lead-400 hover:bg-lead-800 hover:text-lead-100'
                }
              `}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-brand-400' : 'text-lead-500 group-hover:text-lead-300'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400/60" />}
            </Link>
          )
        })}

        <div className="pt-4">
          <p className="px-3 text-[10px] font-semibold text-lead-500 uppercase tracking-widest mb-2">
            Sistema
          </p>
          <Link
            href="/dashboard/configuracoes"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-lead-400 hover:bg-lead-800 hover:text-lead-100 transition-all duration-150"
          >
            <Settings className="w-4.5 h-4.5 shrink-0 text-lead-500 group-hover:text-lead-300" />
            <span>Configurações</span>
          </Link>
        </div>
      </nav>

      {/* Perfil do usuário */}
      <div className="border-t border-lead-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
            {nomeUsuario?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-lead-200 truncate">{nomeUsuario || 'Usuário'}</p>
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
