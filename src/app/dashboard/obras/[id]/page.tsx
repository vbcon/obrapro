import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, MapPin, Calendar, DollarSign,
  Camera, ShoppingCart, Pencil, Clock, CheckCircle2,
  TrendingUp, AlertTriangle,
} from 'lucide-react'
import ProjetosSection from '@/components/obras/ProjetosSection'

const STATUS: Record<string, { label: string; badge: string; dot: string }> = {
  planejamento: { label: 'Planejamento',  badge: 'badge-blue',    dot: 'bg-blue-400' },
  em_andamento: { label: 'Em andamento',  badge: 'badge-green',   dot: 'bg-emerald-500' },
  pausada:      { label: 'Pausada',       badge: 'badge-yellow',  dot: 'bg-amber-400' },
  concluida:    { label: 'Concluída',     badge: 'badge-neutral', dot: 'bg-lead-400' },
  cancelada:    { label: 'Cancelada',     badge: 'badge-red',     dot: 'bg-red-500' },
}

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function fmtData(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default async function ObraDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const [{ data: obra }, { data: arquivos }] = await Promise.all([
    supabase.from('obras').select('*').eq('id', params.id).single(),
    supabase.from('obra_arquivos').select('*').eq('obra_id', params.id).order('criado_em', { ascending: false }),
  ])

  if (!obra) notFound()

  const s    = STATUS[obra.status] || STATUS.planejamento
  const pct  = obra.percentual_conclusao || 0
  const dias = obra.data_prevista
    ? Math.ceil((new Date(obra.data_prevista + 'T00:00:00').getTime() - Date.now()) / 86400000)
    : null

  const diasLabel = dias === null ? '—' : dias < 0 ? `${Math.abs(dias)}d` : `${dias}d`
  const diasSub   = dias === null ? 'sem prazo' : dias < 0 ? 'em atraso' : 'restantes'
  const diasCor   = dias !== null && dias < 0 ? 'text-red-600' : dias !== null && dias < 14 ? 'text-amber-600' : 'text-lead-900'

  const barCor = dias !== null && dias < 0 ? 'bg-red-500' : dias !== null && dias < 14 ? 'bg-amber-400' : 'bg-brand-500'

  return (
    <>
      <Header titulo={obra.nome} subtitulo={`${obra.codigo}${obra.cliente ? ` · ${obra.cliente}` : ''}`} />

      <div className="page-body max-w-5xl">

        {/* ── Nav ── */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/obras"
            className="inline-flex items-center gap-1.5 text-sm text-lead-400 hover:text-lead-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Obras
          </Link>
          <div className="flex items-center gap-2">
            <span className={s.badge}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <Link href={`/dashboard/obras/${obra.id}/editar`} className="btn-secondary btn-sm">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Link>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">

          <div className="card p-5">
            <p className="kpi-label mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Valor do contrato
            </p>
            <p className="text-xl font-bold text-lead-900 tabular-nums leading-none">
              {fmtMoeda(obra.orcamento_total || 0)}
            </p>
            {obra.custo_atual > 0 && (
              <p className="text-xs text-lead-400 mt-1">
                Custo atual: {fmtMoeda(obra.custo_atual)}
              </p>
            )}
          </div>

          <div className="card p-5">
            <p className="kpi-label mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Progresso
            </p>
            <p className="text-xl font-bold text-lead-900 tabular-nums leading-none">{pct}%</p>
            <div className="mt-2 progress-track h-1.5">
              <div className={`progress-fill h-full ${barCor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="card p-5">
            <p className="kpi-label mb-2 flex items-center gap-1.5">
              {dias !== null && dias < 0
                ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                : <Clock className="w-3.5 h-3.5" />
              }
              Prazo
            </p>
            <p className={`text-xl font-bold tabular-nums leading-none ${diasCor}`}>{diasLabel}</p>
            <p className="text-xs text-lead-400 mt-1">{diasSub}</p>
          </div>

          <div className="card p-5">
            <p className="kpi-label mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Início
            </p>
            <p className="text-xl font-bold text-lead-900 tabular-nums leading-none">
              {obra.data_inicio ? fmtData(obra.data_inicio) : '—'}
            </p>
            {obra.data_prevista && (
              <p className="text-xs text-lead-400 mt-1">Prev.: {fmtData(obra.data_prevista)}</p>
            )}
          </div>

        </div>

        {/* ── Info cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up animation-delay-75">

          {/* Dados da obra */}
          <div className="card">
            <div className="section-header">
              <span className="section-title flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-brand-50 flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-brand-600" />
                </span>
                Dados da obra
              </span>
            </div>
            <dl className="divide-y divide-lead-100/80">
              {[
                ['Código',    obra.codigo  || '—'],
                ['Cliente',   obra.cliente || '—'],
                ['Tipo',      obra.tipo    || '—'],
                ['Pagamento', obra.forma_pagamento || '—'],
                ['Condições', obra.condicao_pagamento || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-5 py-3">
                  <dt className="w-28 text-xs font-medium text-lead-400 shrink-0">{k}</dt>
                  <dd className="text-sm font-medium text-lead-800 flex-1 truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Localização + Datas */}
          <div className="space-y-4">
            <div className="card">
              <div className="section-header">
                <span className="section-title flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-blue-600" />
                  </span>
                  Localização
                </span>
              </div>
              <dl className="divide-y divide-lead-100/80">
                {[
                  ['Endereço', obra.endereco || '—'],
                  ['Cidade',   `${obra.cidade || '—'}${obra.estado ? `, ${obra.estado}` : ''}`],
                  ['CEP',      obra.cep      || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-5 py-3">
                    <dt className="w-20 text-xs font-medium text-lead-400 shrink-0">{k}</dt>
                    <dd className="text-sm font-medium text-lead-800 flex-1 truncate">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card">
              <div className="section-header">
                <span className="section-title flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                  </span>
                  Cronograma
                </span>
              </div>
              <dl className="divide-y divide-lead-100/80">
                {[
                  ['Início',     fmtData(obra.data_inicio)],
                  ['Previsão',   fmtData(obra.data_prevista)],
                  ['Conclusão',  fmtData(obra.data_conclusao)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-5 py-3">
                    <dt className="w-20 text-xs font-medium text-lead-400 shrink-0">{k}</dt>
                    <dd className="text-sm font-medium text-lead-800 flex-1">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

        </div>

        {/* ── Projetos e arquivos ── */}
        <ProjetosSection obraId={obra.id} arquivosIniciais={arquivos || []} />

        {/* ── Ações rápidas ── */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-lead-400 uppercase tracking-wider mb-3">Ações rápidas</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/diario/nova?obra=${obra.id}`} className="btn-secondary btn-sm">
              <Camera className="w-3.5 h-3.5" />
              Novo status
            </Link>
            <Link href={`/dashboard/compras/nova?obra=${obra.id}`} className="btn-secondary btn-sm">
              <ShoppingCart className="w-3.5 h-3.5" />
              Nova solicitação
            </Link>
          </div>
        </div>

        {/* ── Anotações ── */}
        {obra.anotacoes && (
          <div className="card p-5 animate-fade-up animation-delay-150">
            <p className="text-xs font-semibold text-lead-400 uppercase tracking-wider mb-3">Anotações</p>
            <p className="text-sm text-lead-600 whitespace-pre-wrap leading-relaxed">{obra.anotacoes}</p>
          </div>
        )}

      </div>
    </>
  )
}
