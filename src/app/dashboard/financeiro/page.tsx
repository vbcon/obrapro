'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { DollarSign, Plus, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, Pencil, Filter, X } from 'lucide-react'

const TIPO_MAP: Record<string, { label: string; badge: string; sinal: '+' | '-' }> = {
  materiais:            { label: 'Materiais',            badge: 'badge-blue',    sinal: '-' },
  mao_obra:             { label: 'Mão de obra',          badge: 'badge-purple',  sinal: '-' },
  locacao_equipamentos: { label: 'Locação Equip.',       badge: 'badge-yellow',  sinal: '-' },
  reembolso:            { label: 'Reembolso',            badge: 'badge-brand',   sinal: '-' },
  medicao_vbcon:        { label: 'Medição VBCON',        badge: 'badge-green',   sinal: '+' },
}

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; cor: string }> = {
  pendente:  { label: 'Pendente',  icon: Clock,         cor: 'text-amber-600' },
  pago:      { label: 'Pago',      icon: CheckCircle2,  cor: 'text-emerald-600' },
  atrasado:  { label: 'Atrasado',  icon: AlertTriangle, cor: 'text-red-600' },
  cancelado: { label: 'Cancelado', icon: TrendingDown,  cor: 'text-lead-400' },
}

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function fmtData(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function FinanceiroPage() {
  const [lista, setLista]   = useState<any[]>([])
  const [obras, setObras]   = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [carregando, setCarregando] = useState(true)

  const [filtroObra,   setFiltroObra]   = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroDe,     setFiltroDe]     = useState('')
  const [filtroAte,    setFiltroAte]    = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('financeiro').select('*, obras(id, nome, codigo)').order('data_referencia', { ascending: false }),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ]).then(([{ data: l }, { data: o }]) => {
      setLista(l || [])
      setObras(o || [])
      setCarregando(false)
    })
  }, [])

  const filtrada = useMemo(() => lista.filter(l => {
    if (filtroObra   && l.obra_id !== filtroObra)         return false
    if (filtroStatus && l.status  !== filtroStatus)       return false
    if (filtroTipo   && l.tipo    !== filtroTipo)         return false
    if (filtroDe     && l.data_referencia < filtroDe)     return false
    if (filtroAte    && l.data_referencia > filtroAte)    return false
    return true
  }), [lista, filtroObra, filtroStatus, filtroTipo, filtroDe, filtroAte])

  const temFiltro = filtroObra || filtroStatus || filtroTipo || filtroDe || filtroAte

  function limparFiltros() {
    setFiltroObra(''); setFiltroStatus(''); setFiltroTipo(''); setFiltroDe(''); setFiltroAte('')
  }

  const totalPago     = filtrada.filter(l => l.status === 'pago').reduce((a, l) => a + (l.valor || 0), 0)
  const totalPendente = filtrada.filter(l => l.status === 'pendente').reduce((a, l) => a + (l.valor || 0), 0)
  const totalAtrasado = filtrada.filter(l => l.status === 'atrasado').reduce((a, l) => a + (l.valor || 0), 0)

  return (
    <>
      <Header titulo="Financeiro" subtitulo="Medições e pagamentos das obras" />

      <div className="page-body">

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="kpi-value text-emerald-600">{fmtMoeda(totalPago)}</p>
            <p className="text-xs text-lead-400 mt-1">Total pago</p>
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

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-lead-400" />
            <span className="text-xs font-semibold text-lead-500 uppercase tracking-wider">Filtros</span>
            {temFiltro && (
              <button onClick={limparFiltros}
                className="ml-auto text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium transition-colors">
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} className="select select-sm">
              <option value="">Todas as obras</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="select select-sm">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="select select-sm">
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-lead-400 shrink-0">De</span>
              <input type="date" value={filtroDe} onChange={e => setFiltroDe(e.target.value)} className="input input-sm flex-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-lead-400 shrink-0">Até</span>
              <input type="date" value={filtroAte} onChange={e => setFiltroAte(e.target.value)} className="input input-sm flex-1" />
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="card animate-fade-up animation-delay-75">
          <div className="section-header">
            <span className="section-title">
              Lançamentos
              {temFiltro && (
                <span className="ml-2 text-xs font-normal text-lead-400">
                  {filtrada.length} de {lista.length}
                </span>
              )}
            </span>
            <Link href="/dashboard/financeiro/novo" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Novo lançamento
            </Link>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
          ) : filtrada.length === 0 ? (
            <div className="empty-state py-16">
              <div className="empty-state-icon">
                <DollarSign className="w-6 h-6 text-lead-400" />
              </div>
              <p className="text-sm font-medium text-lead-600">
                {temFiltro ? 'Nenhum resultado para os filtros aplicados' : 'Nenhum lançamento'}
              </p>
              {temFiltro && (
                <button onClick={limparFiltros} className="btn-secondary btn-sm mt-4">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {filtrada.map((l: any) => {
                const tipo = TIPO_MAP[l.tipo]     || { label: l.tipo, badge: 'badge-neutral', sinal: '-' as const }
                const sts  = STATUS_MAP[l.status] || STATUS_MAP.pendente
                const Icon = sts.icon
                return (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-lead-900 truncate">{l.descricao}</p>
                      <p className="text-xs text-lead-400 mt-0.5">
                        {l.obras?.codigo} — {l.obras?.nome}
                        {l.data_referencia && <span className="ml-2">{fmtData(l.data_referencia)}</span>}
                      </p>
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

          {/* Totais rodapé */}
          {filtrada.length > 0 && (
            <div className="px-6 py-3 border-t border-lead-100 bg-lead-50/50 flex flex-wrap gap-4 justify-end">
              <span className="text-xs text-lead-500">
                {filtrada.length} lançamento{filtrada.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs font-semibold text-lead-700">
                Total: {fmtMoeda(filtrada.reduce((s, l) => s + (l.valor || 0), 0))}
              </span>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
