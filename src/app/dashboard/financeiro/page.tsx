import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { DollarSign, Plus, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, Pencil } from 'lucide-react'

const TIPO: Record<string, { label: string; badge: string; sinal: '+' | '-' }> = {
  medicao:      { label: 'Medição',      badge: 'badge-blue',   sinal: '+' },
  pagamento:    { label: 'Pagamento',    badge: 'badge-green',  sinal: '+' },
  adiantamento: { label: 'Adiantamento', badge: 'badge-brand',  sinal: '+' },
  retencao:     { label: 'Retenção',     badge: 'badge-yellow', sinal: '-' },
  multa:        { label: 'Multa',        badge: 'badge-red',    sinal: '-' },
}

const STATUS: Record<string, { label: string; icon: React.ElementType; cor: string }> = {
  pendente:  { label: 'Pendente',  icon: Clock,         cor: 'text-amber-600' },
  pago:      { label: 'Pago',      icon: CheckCircle2,  cor: 'text-emerald-600' },
  atrasado:  { label: 'Atrasado',  icon: AlertTriangle, cor: 'text-red-600' },
  cancelado: { label: 'Cancelado', icon: TrendingDown,  cor: 'text-lead-400' },
}

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: lancamentos } = await supabase
    .from('financeiro')
    .select('*, obras(nome, codigo)')
    .order('data_referencia', { ascending: false })

  const lista = lancamentos || []

  const totalPago     = lista.filter((l: any) => l.status === 'pago').reduce((a: number, l: any) => a + l.valor, 0)
  const totalPendente = lista.filter((l: any) => l.status === 'pendente').reduce((a: number, l: any) => a + l.valor, 0)
  const totalAtrasado = lista.filter((l: any) => l.status === 'atrasado').reduce((a: number, l: any) => a + l.valor, 0)

  return (
    <>
      <Header titulo="Financeiro" subtitulo="Medições e pagamentos das obras" />

      <div className="page-body">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="kpi-value text-emerald-600">{fmtMoeda(totalPago)}</p>
            <p className="text-xs text-lead-400 mt-1">Total recebido</p>
          </div>
          <div className="card p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="kpi-value text-amber-600">{fmtMoeda(totalPendente)}</p>
            <p className="text-xs text-lead-400 mt-1">A receber</p>
          </div>
          <div className="card p-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="kpi-value text-red-600">{fmtMoeda(totalAtrasado)}</p>
            <p className="text-xs text-lead-400 mt-1">Em atraso</p>
          </div>
        </div>

        {/* ── Lista ── */}
        <div className="card animate-fade-up animation-delay-75">
          <div className="section-header">
            <span className="section-title">Lançamentos</span>
            <Link href="/dashboard/financeiro/novo" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Novo lançamento
            </Link>
          </div>

          {lista.length === 0 ? (
            <div className="empty-state py-16">
              <div className="empty-state-icon">
                <DollarSign className="w-6 h-6 text-lead-400" />
              </div>
              <p className="text-sm font-medium text-lead-600">Nenhum lançamento</p>
              <p className="text-xs text-lead-400 mt-1">Registre medições e pagamentos das obras</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {lista.map((l: any) => {
                const tipo = TIPO[l.tipo]     || TIPO.pagamento
                const sts  = STATUS[l.status] || STATUS.pendente
                const Icon = sts.icon
                return (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-lead-900 truncate">{l.descricao}</p>
                      <p className="text-xs text-lead-400 mt-0.5">{l.obras?.codigo} — {l.obras?.nome}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`${tipo.badge} hidden sm:inline-flex`}>{tipo.label}</span>
                      <p className="text-[13px] font-bold text-lead-900 tabular-nums">
                        <span className={tipo.sinal === '+' ? 'text-emerald-600' : 'text-red-600'}>{tipo.sinal}</span>
                        {fmtMoeda(l.valor)}
                      </p>
                      <Icon className={`w-4 h-4 ${sts.cor} shrink-0`} />
                      <Link href={`/dashboard/financeiro/${l.id}/editar`}
                        className="p-1.5 rounded-md text-lead-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
