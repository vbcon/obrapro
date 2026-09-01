'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/lib/context/SidebarContext'
import { useChat } from '@/lib/context/ChatContext'
import type { Papel } from '@/lib/types/roles'
import {
  HardHat, CalendarDays, ShoppingCart,
  LogOut, LayoutDashboard,
  Settings, BookOpen, DollarSign, Users, Inbox, X, Sparkles, ListTodo,
} from 'lucide-react'

const NAV_PRINCIPAL = [
  { label: 'Dashboard',      href: '/dashboard',                icon: LayoutDashboard, exact: true, papeis: ['admin','cliente','arquiteto'] },
  { label: 'Obras',          href: '/dashboard/obras',          icon: HardHat,         papeis: ['admin','cliente'] },
  { label: 'Tarefas',        href: '/dashboard/tarefas',        icon: ListTodo,        papeis: ['admin','arquiteto'] },
  { label: 'Compras',        href: '/dashboard/compras',        icon: ShoppingCart,    papeis: ['admin','cliente'] },
  { label: 'Financeiro',     href: '/dashboard/financeiro',     icon: DollarSign,      papeis: ['admin','cliente'] },
  { label: 'Cronograma',     href: '/dashboard/cronograma',     icon: CalendarDays,    papeis: ['admin','cliente','arquiteto'] },
  { label: 'Status da Obra', href: '/dashboard/diario',         icon: BookOpen,        papeis: ['admin','cliente','arquiteto'] },
  { label: 'Solicitações',   href: '/dashboard/solicitacoes',   icon: Inbox,           papeis: ['admin','arquiteto'] },
]

const NAV_SISTEMA = [
  { label: 'Usuários',      href: '/dashboard/configuracoes/usuarios', icon: Users,    papeis: ['admin'] },
  { label: 'Configurações', href: '/dashboard/configuracoes',          icon: Settings, papeis: ['admin','cliente','arquiteto'], exact: true },
]

const PAPEL_INFO: Record<string, { label: string; bg: string; color: string }> = {
  admin:     { label: 'Admin',     bg: '#fff3e0', color: '#e65100' },
  cliente:   { label: 'Cliente',   bg: '#e3f2fd', color: '#1565c0' },
  arquiteto: { label: 'Arquiteto', bg: '#f3e5f5', color: '#6a1b9a' },
}

interface SidebarProps {
  nomeUsuario?: string
  emailUsuario?: string
  papel: string
}

export default function Sidebar({ nomeUsuario, emailUsuario, papel }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { isOpen, close } = useSidebar()
  const { open: abrirChat } = useChat()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navPrincipal = NAV_PRINCIPAL.filter(i => i.papeis.includes(papel))
  const navSistema   = NAV_SISTEMA.filter(i => i.papeis.includes(papel))
  const papelInfo    = PAPEL_INFO[papel] ?? PAPEL_INFO.admin

  const initials = nomeUsuario
    ? nomeUsuario.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={close} />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb' }}
      >

        {/* ── Logo ── */}
        <div className="relative flex flex-col items-center justify-center shrink-0 py-5"
          style={{ borderBottom: '1px solid #f3f4f6' }}>

          <button onClick={close} className="md:hidden absolute top-2 right-2 p-1.5 rounded-lg text-lead-400 hover:text-lead-700 hover:bg-lead-100 transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="VBCON Engenharia" style={{ width: 148, height: 148, objectFit: 'contain' }} />
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">

          <NavSection label="Módulos">
            {navPrincipal.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                active={isActive(item.href, item.exact)} onClick={close} />
            ))}
            <NavButton icon={Sparkles} label="Assistente IA"
              onClick={() => { abrirChat(); close() }} />
          </NavSection>

          {navSistema.length > 0 && (
            <NavSection label="Sistema" className="mt-3">
              {navSistema.map(item => (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                  active={isActive(item.href, item.exact)} onClick={close} />
              ))}
            </NavSection>
          )}

        </nav>

        {/* ── User ── */}
        <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid #f3f4f6' }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl group hover:bg-lead-50 transition-colors cursor-default">

            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-[11px] font-bold select-none"
              style={{ background: '#fff3e0', color: '#e65100', boxShadow: '0 0 0 1.5px #fbd38d' }}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold leading-none truncate text-lead-800">
                  {nomeUsuario || 'Usuário'}
                </p>
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ background: papelInfo.bg, color: papelInfo.color }}>
                  {papelInfo.label}
                </span>
              </div>
              <p className="text-[11px] truncate text-lead-400 mt-0.5">{emailUsuario}</p>
            </div>

            <button onClick={handleLogout} title="Sair"
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-lead-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>
    </>
  )
}

/* ── Sub-components ── */

function NavSection({ label, children, className = '' }: {
  label: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-lead-400">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavItem({ href, icon: Icon, label, active, onClick }: {
  href: string; icon: React.ElementType; label: string; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13.5px] transition-all duration-150 select-none"
      style={{
        fontWeight: active ? 600 : 400,
        color:      active ? '#c2410c' : '#6b7280',
        background: active ? '#fff3e0' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' } }}
    >
      <Icon className="shrink-0 w-4 h-4" style={{ color: active ? '#f97316' : '#9ca3af' }} />
      <span className="flex-1 leading-none">{label}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-brand-500" />}
    </Link>
  )
}

function NavButton({ icon: Icon, label, onClick }: {
  icon: React.ElementType; label: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13.5px] transition-all duration-150 select-none"
      style={{ fontWeight: 400, color: '#6b7280', background: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = '#c2410c' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
    >
      <Icon className="shrink-0 w-4 h-4 text-orange-500" />
      <span className="flex-1 leading-none text-left">{label}</span>
    </button>
  )
}
