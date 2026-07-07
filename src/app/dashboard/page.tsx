import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  HardHat, ShoppingCart, CalendarDays, AlertTriangle,
  ArrowUpRight, Clock, CheckCircle2, TrendingUp, Package,
  Camera, ClipboardList, Flag, Truck, Users2, Eye, CreditCard,
  HelpCircle, CircleDot,
} from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────── */
type ObraHealth = 'saudavel' | 'atencao' | 'critica' | 'concluida' | 'pausada'

function getHealth(obra: any): ObraHealth {
  if (obra.status === 'concluida') return 'concluida'
  if (obra.status === 'cancelada') return 'critica'
  if (obra.status === 'pausada')   return 'pausada'
  if (!obra.data_prevista)         return 'saudavel'
  const dias = Math.ceil((new Date(obra.data_prevista + 'T00:00:00').getTime() - Date.now()) / 86400000)
  if (dias < 0)  return 'critica'
  if (dias < 21) return 'atencao'
  return 'saudavel'
}

function getDias(data?: string | null): number | null {
  if (!data) return null
  return Math.ceil((new Date(data + 'T00:00:00').getTime() - Date.now()) / 86400000)
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const tipoEvento: Record<string, { icon: React.ElementType; color: string }> = {
  marco:     { icon: Flag,        color: 'text-brand-600 bg-brand-50'   },
  entrega:   { icon: Truck,       color: 'text-purple-600 bg-purple-50' },
  reuniao:   { icon: Users2,      color: 'text-blue-600 bg-blue-50'     },
  vistoria:  { icon: Eye,         color: 'text-teal-600 bg-teal-50'     },
  pagamento: { icon: CreditCard,  color: 'text-green-600 bg-green-50'   },
  outro:     { icon: HelpCircle,  color: 'text-lead-600 bg-lead-100'    },
}

/* ── página ───────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient()
  const hoje    = new Date().toISOString().split('T')[0]
  const em14    = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const [
    { data: obras },
    { count: aprovacoesCount },
    { count: comprasAbertasCount },
    { data: eventos },
    { data: ultimosStatus },
    { data: ultimasOCs },
  ] = await Promise.all([
    supabase.from('obras').select('id,nome,codigo,cliente,status,percentual_conclusao,data_prevista,data_inicio,orcamento_total,custo_atual').order('criado_em', { ascending: false }),
    supabase.from('cotacoes').select('*', { count: 'exact', head: true }).eq('status', 'aguardando_cliente'),
    supabase.from('solicitacoes_compra').select('*', { count: 'exact', head: true }).in('status', ['aberta', 'em_cotacao']),
    supabase.from('cronograma').select('id,titulo,tipo,data_inicio,obras(nome,codigo)').eq('concluido', false).gte('data_inicio', hoje).lte('data_inicio', em14).order('data_inicio').limit(6),
    supabase.from('diario_obra').select('id,data,obras(nome,codigo)').order('data', { ascending: false }).limit(4),
    supabase.from('compras').select('id,numero_pedido,valor_total,obras(nome)').order('criado_em', { ascending: false }).limit(3),
  ])

  const lista = obras || []
  const ativas = lista.filter(o => o.status === 'em_andamento' || o.status === 'planejamento')

  const healthCount = {
    saudavel: lista.filter(o => ['saudavel'].includes(getHealth(o))).length,
    atencao:  lista.filter(o => ['atencao', 'pausada'].includes(getHealth(o))).length,
    critica:  lista.filter(o => getHealth(o) === 'critica').length,
    concluida: lista.filter(o => getHealth(o) === 'concluida').length,
  }

  const alertas = [
    aprovacoesCount   && aprovacoesCount > 0   ? { tipo: 'danger',  texto: `${aprovacoesCount} aprovação${aprovacoesCount > 1 ? 'ões' : ''} pendente${aprovacoesCount > 1 ? 's' : ''}`, href: '/dashboard/compras', icon: ClipboardList } : null,
    comprasAbertasCount && comprasAbertasCount > 0 ? { tipo: 'warning', texto: `${comprasAbertasCount} solicitação${comprasAbertasCount > 1 ? 'ões' : ''} em aberto`, href: '/dashboard/compras', icon: ShoppingCart } : null,
    healthCount.critica > 0 ? { tipo: 'danger', texto: `${healthCount.critica} obra${healthCount.critica > 1 ? 's' : ''} com prazo vencido`, href: '/dashboard/obras', icon: AlertTriangle } : null,
    healthCount.atencao > 0 ? { tipo: 'warning', texto: `${healthCount.atencao} obra${healthCount.atencao > 1 ? 's' : ''} precisando atenção`, href: '/dashboard/obras', icon: Clock } : null,
  ].filter(Boolean) as { tipo: string; texto: string; href: string; icon: React.ElementType }[]

  const hoje_d = new Date()
  const saudacao = hoje_d.getHours() < 12 ? 'Bom dia' : hoje_d.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const dataFormatada = hoje_d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 space-y-6 animate-fade-up">

      {/* ── GREETING ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-lead-900">{saudacao}! 👋</h1>
          <p className="text-sm text-lead-500 mt-0.5 capitalize">{dataFormatada} · {ativas.length} obra{ativas.length !== 1 ? 's' : ''} ativa{ativas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/obras/nova" className="btn-primary hidden sm:inline-flex">
          <HardHat className="w-4 h-4" />Nova obra
        </Link>
      </div>

      {/* ── HEALTH OVERVIEW ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/obras?filtro=saudavel" className="card-hover p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <span className="health-dot-green animate-pulse" />
            <span className="text-xs font-semibold text-lead-500 uppercase tracking-wide">Saudáveis</span>
          </div>
          <p className="text-3xl font-bold text-green-600 tabular-nums">{healthCount.saudavel}</p>
          <p className="text-xs text-lead-400 mt-0.5">obras em dia</p>
        </Link>

        <Link href="/dashboard/obras?filtro=atencao" className="card-hover p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <span className="health-dot-yellow" />
            <span className="text-xs font-semibold text-lead-500 uppercase tracking-wide">Atenção</span>
          </div>
          <p className="text-3xl font-bold text-amber-500 tabular-nums">{healthCount.atencao}</p>
          <p className="text-xs text-lead-400 mt-0.5">precisam atenção</p>
        </Link>

        <Link href="/dashboard/obras?filtro=critica" className="card-hover p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <span className="health-dot-red" />
            <span className="text-xs font-semibold text-lead-500 uppercase tracking-wide">Críticas</span>
          </div>
          <p className="text-3xl font-bold text-red-600 tabular-nums">{healthCount.critica}</p>
          <p className="text-xs text-lead-400 mt-0.5">atrasadas</p>
        </Link>

        <Link href="/dashboard/obras?filtro=concluida" className="card-hover p-4 group">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-2.5 h-2.5 text-lead-400" />
            <span className="text-xs font-semibold text-lead-500 uppercase tracking-wide">Concluídas</span>
          </div>
          <p className="text-3xl font-bold text-lead-600 tabular-nums">{healthCount.concluida}</p>
          <p className="text-xs text-lead-400 mt-0.5">finalizadas</p>
        </Link>
      </div>

      {/* ── ALERTAS ──────────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className="space-y-2 animate-fade-up animation-delay-75">
          {alertas.map((alerta, i) => {
            const AlertIcon = alerta.icon
            return (
              <Link key={i} href={alerta.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 hover:brightness-95 ${alerta.tipo === 'danger' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <AlertIcon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{alerta.texto}</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
              </Link>
            )
          })}
        </div>
      )}

      {/* ── OBRAS + EVENTOS ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-fade-up animation-delay-150">

        {/* Obras em andamento */}
        <div className="card lg:col-span-3">
          <div className="section-header">
            <span className="section-title">Obras em andamento</span>
            <Link href="/dashboard/obras" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {ativas.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><HardHat className="w-6 h-6 text-lead-400" /></div>
              <p className="text-sm font-medium text-lead-600">Nenhuma obra ativa</p>
              <Link href="/dashboard/obras/nova" className="btn-primary mt-4 text-xs">Cadastrar obra</Link>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {ativas.slice(0, 6).map((obra) => {
                const health = getHealth(obra)
                const dias = getDias(obra.data_prevista)
                const pct = obra.percentual_conclusao || 0

                const healthDot = health === 'critica' ? 'bg-red-500' : health === 'atencao' ? 'bg-amber-400' : 'bg-green-500'
                const barColor = health === 'critica' ? 'bg-red-500' : health === 'atencao' ? 'bg-amber-400' : 'bg-green-500'
                const diasLabel = dias === null ? null : dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Vence hoje' : `${dias}d restantes`
                const diasColor = dias === null ? '' : dias < 0 ? 'text-red-600' : dias < 7 ? 'text-amber-600' : 'text-lead-500'

                return (
                  <Link key={obra.id} href={`/dashboard/obras/${obra.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-lead-50/70 transition-colors group">
                    <span className={`health-dot ${healthDot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-semibold text-lead-900 truncate">{obra.nome}</p>
                        <span className="text-sm font-bold text-lead-700 tabular-nums ml-2 shrink-0">{pct}%</span>
                      </div>
                      <div className="progress-track h-1.5 mb-1.5">
                        <div className={`progress-fill h-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-lead-400 truncate">{obra.cliente}</p>
                        {diasLabel && <span className={`text-xs font-medium shrink-0 ml-2 ${diasColor}`}>{diasLabel}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Próximos eventos */}
        <div className="card lg:col-span-2">
          <div className="section-header">
            <span className="section-title">Próximos 14 dias</span>
            <Link href="/dashboard/cronograma" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Cronograma <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {!eventos || eventos.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><CalendarDays className="w-6 h-6 text-lead-400" /></div>
              <p className="text-sm font-medium text-lead-600">Sem eventos próximos</p>
              <Link href="/dashboard/cronograma/novo" className="btn-ghost mt-2 text-xs">Adicionar evento</Link>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {eventos.map((ev: any) => {
                const cfg = tipoEvento[ev.tipo] || tipoEvento.outro
                const Icon = cfg.icon
                const data = new Date(ev.data_inicio + 'T00:00:00')
                const dias = getDias(ev.data_inicio)

                return (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-lead-900 truncate">{ev.titulo}</p>
                      <p className="text-xs text-lead-400 truncate">{(ev.obras as any)?.codigo} — {(ev.obras as any)?.nome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-lead-700 tabular-nums">{data.getDate()}/{data.getMonth() + 1}</p>
                      <p className={`text-[10px] font-medium ${dias === 0 ? 'text-red-600' : dias && dias <= 3 ? 'text-amber-600' : 'text-lead-400'}`}>
                        {dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `${dias}d`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ATIVIDADE RECENTE ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-up animation-delay-300">

        {/* Status recentes */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Status recentes</span>
            <Link href="/dashboard/diario" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {!ultimosStatus || ultimosStatus.length === 0 ? (
            <div className="empty-state py-10">
              <div className="empty-state-icon"><Camera className="w-6 h-6 text-lead-400" /></div>
              <p className="text-sm text-lead-500">Nenhum registro ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {ultimosStatus.map((s: any) => {
                const data = new Date(s.data + 'T00:00:00')
                const diasAtras = Math.floor((Date.now() - data.getTime()) / 86400000)
                return (
                  <Link key={s.id} href={`/dashboard/diario/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-lead-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <Camera className="w-3.5 h-3.5 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-lead-900 truncate">{s.obras?.codigo} — {s.obras?.nome}</p>
                      <p className="text-xs text-lead-400">Registro de status</p>
                    </div>
                    <span className="text-xs text-lead-400 shrink-0">{diasAtras === 0 ? 'Hoje' : diasAtras === 1 ? 'Ontem' : `${diasAtras}d atrás`}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Ordens de compra recentes */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Ordens de compra recentes</span>
            <Link href="/dashboard/compras" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {!ultimasOCs || ultimasOCs.length === 0 ? (
            <div className="empty-state py-10">
              <div className="empty-state-icon"><Package className="w-6 h-6 text-lead-400" /></div>
              <p className="text-sm text-lead-500">Nenhuma O.C. ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {ultimasOCs.map((oc: any) => (
                <Link key={oc.id} href={`/dashboard/compras/oc/${oc.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-lead-50/70 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lead-900 font-mono">{oc.numero_pedido || 'O.C.'}</p>
                    <p className="text-xs text-lead-400 truncate">{oc.obras?.nome}</p>
                  </div>
                  <span className="text-sm font-bold text-lead-800 shrink-0 tabular-nums">{fmt(oc.valor_total)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────── */}
      <div className="card p-5 animate-fade-up animation-delay-500">
        <p className="text-xs font-semibold text-lead-500 uppercase tracking-wide mb-3">Ações rápidas</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Nova obra',        href: '/dashboard/obras/nova',       icon: HardHat },
            { label: 'Nova solicitação', href: '/dashboard/compras/nova',     icon: ShoppingCart },
            { label: 'Nova O.C. direta', href: '/dashboard/compras/oc/nova',  icon: Package },
            { label: 'Novo evento',      href: '/dashboard/cronograma/novo',  icon: CalendarDays },
            { label: 'Novo status',      href: '/dashboard/diario/nova',      icon: Camera },
            { label: 'Novo lançamento',  href: '/dashboard/financeiro/novo',  icon: TrendingUp },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-lead-200 text-xs font-medium text-lead-700 hover:bg-lead-50 hover:border-lead-300 transition-all duration-150">
              <Icon className="w-3.5 h-3.5 text-lead-500" />{label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
