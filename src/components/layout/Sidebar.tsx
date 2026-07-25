'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/lib/context/SidebarContext'
import type { Papel } from '@/lib/types/roles'
import {
  HardHat, CalendarDays, ShoppingCart,
  LogOut, LayoutDashboard,
  Settings, BookOpen, DollarSign, Users, Inbox, X,
} from 'lucide-react'

const NAV_PRINCIPAL = [
  { label: 'Dashboard',      href: '/dashboard',                icon: LayoutDashboard, exact: true, papeis: ['admin','cliente','arquiteto'] },
  { label: 'Obras',          href: '/dashboard/obras',          icon: HardHat,         papeis: ['admin','cliente'] },
  { label: 'Compras',        href: '/dashboard/compras',        icon: ShoppingCart,    papeis: ['admin','cliente'] },
  { label: 'Financeiro',     href: '/dashboard/financeiro',     icon: DollarSign,      papeis: ['admin','cliente'] },
  { label: 'Cronograma',     href: '/dashboard/cronograma',     icon: CalendarDays,    papeis: ['admin','cliente','arquiteto'] },
  { label: 'Status da Obra', href: '/dashboard/diario',         icon: BookOpen,        papeis: ['admin','cliente','arquiteto'] },
  { label: 'Solicitações',   href: '/dashboard/solicitacoes',   icon: Inbox,           papeis: ['admin','cliente','arquiteto'] },
]

const NAV_SISTEMA = [
  { label: 'Usuários',      href: '/dashboard/configuracoes/usuarios', icon: Users,    papeis: ['admin'] },
  { label: 'Configurações', href: '/dashboard/configuracoes',          icon: Settings, papeis: ['admin','cliente','arquiteto'], exact: true },
]

const PAPEL_INFO: Record<Papel, { label: string; cls: string }> = {
  admin:     { label: 'Admin',     cls: 'bg-orange-500/15 text-orange-300' },
  cliente:   { label: 'Cliente',   cls: 'bg-sky-500/15 text-sky-300' },
  arquiteto: { label: 'Arquiteto', cls: 'bg-violet-500/15 text-violet-300' },
}

interface SidebarProps {
  nomeUsuario?: string
  emailUsuario?: string
  papel: Papel
}

export default function Sidebar({ nomeUsuario, emailUsuario, papel }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { isOpen, close } = useSidebar()

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
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
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >

        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-5 shrink-0"
          style={{ height: 'var(--header-height)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          {/* VBCON logo mark */}
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 w-8 h-8">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.5" y="1.5" width="29" height="29" stroke="white" strokeWidth="2"/>
                <polygon points="5,5 16,25 27,5 23.5,5 16,20 8.5,5" fill="#f97316"/>
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-white font-black text-[15px] tracking-wider leading-none">VBCON</p>
              <p className="text-[9px] font-bold tracking-[0.18em] leading-none mt-1" style={{ color: '#f97316' }}>
                ENGENHARIA
              </p>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={close}
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-2.5 py-4 overflow-y-auto">

          <NavSection label="Módulos">
            {navPrincipal.map(item => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href, item.exact)}
                onClick={close}
              />
            ))}
          </NavSection>

          {navSistema.length > 0 && (
            <NavSection label="Sistema" className="mt-2">
              {navSistema.map(item => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href, item.exact)}
                  onClick={close}
                />
              ))}
            </NavSection>
          )}

        </nav>

        {/* ── User profile ── */}
        <div className="px-2.5 pb-3 pt-2 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg group"
            style={{ transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-[11px] font-bold text-orange-300 select-none"
              style={{ background: 'rgba(249,115,22,0.12)', boxShadow: '0 0 0 1px rgba(249,115,22,0.2)' }}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[13px] font-medium leading-none truncate"
                  style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {nomeUsuario || 'Usuário'}
                </p>
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${papelInfo.cls}`}>
                  {papelInfo.label}
                </span>
              </div>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {emailUsuario}
              </p>
            </div>

            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-md transition-all duration-150 opacity-0 group-hover:opacity-100"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#f87171'
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
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
      <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'rgba(255,255,255,0.22)' }}>
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
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-all duration-150 select-none"
      style={{
        fontWeight: active ? 500 : 400,
        color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.42)',
        background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(255,255,255,0.42)'
        }
      }}
    >
      <Icon
        className="shrink-0"
        style={{
          width: 16, height: 16,
          color: active ? '#fb923c' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.15s',
        }}
      />
      <span className="flex-1 leading-none">{label}</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#fb923c', opacity: 0.8 }} />
      )}
    </Link>
  )
}
