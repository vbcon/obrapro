'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  CalendarDays, Plus, CheckCircle2, Circle, Trash2,
  ChevronUp, ChevronDown, GanttChartSquare, AlertCircle,
} from 'lucide-react'

const CATEGORIA_CORES: Record<string, string> = {
  estrutura:     'bg-stone-100   text-stone-700',
  alvenaria:     'bg-amber-100   text-amber-700',
  instalacoes:   'bg-blue-100    text-blue-700',
  acabamento:    'bg-purple-100  text-purple-700',
  cobertura:     'bg-teal-100    text-teal-700',
  fundacao:      'bg-red-100     text-red-700',
  revestimento:  'bg-orange-100  text-orange-700',
  esquadrias:    'bg-cyan-100    text-cyan-700',
  pintura:       'bg-pink-100    text-pink-700',
  paisagismo:    'bg-emerald-100 text-emerald-700',
  hidraulica:    'bg-sky-100     text-sky-700',
  eletrica:      'bg-yellow-100  text-yellow-700',
  outro:         'bg-lead-100    text-lead-600',
}

function cor(cat?: string) { return CATEGORIA_CORES[cat || 'outro'] || CATEGORIA_CORES.outro }

function fmtData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function calcTermino(inicio?: string, dias?: number) {
  if (!inicio || !dias) return null
  const d = new Date(inicio + 'T00:00:00')
  d.setDate(d.getDate() + dias - 1)
  return d.toISOString().split('T')[0]
}

export default function CronogramaPage() {
  const [etapas, setEtapas]   = useState<any[]>([])
  const [obras, setObras]     = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [obraFiltro, setObraFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const load = useCallback(async () => {
    setCarregando(true)
    const supabase = createClient()
    const [evRes, obRes] = await Promise.all([
      supabase.from('cronograma')
        .select('*, obras(nome, codigo)')
        .order('obra_id')
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('data_inicio', { ascending: true }),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ])
    setEtapas(evRes.data || [])
    setObras(obRes.data || [])
    setCarregando(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleConcluido(e: any) {
    const supabase = createClient()
    await supabase.from('cronograma').update({ concluido: !e.concluido }).eq('id', e.id)
    setEtapas(prev => prev.map(x => x.id === e.id ? { ...x, concluido: !x.concluido } : x))
  }

  async function deletar(id: string) {
    if (!confirm('Excluir esta etapa?')) return
    const supabase = createClient()
    await supabase.from('cronograma').delete().eq('id', id)
    setEtapas(prev => prev.filter(x => x.id !== id))
  }

  async function moverOrdem(etapa: any, dir: 'up' | 'down') {
    const lista = etapas.filter(x => x.obra_id === etapa.obra_id).sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
    const idx = lista.findIndex(x => x.id === etapa.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= lista.length) return

    const supabase = createClient()
    const a = lista[idx], b = lista[swapIdx]
    const ordA = a.ordem ?? idx + 1
    const ordB = b.ordem ?? swapIdx + 1
    await Promise.all([
      supabase.from('cronograma').update({ ordem: ordB }).eq('id', a.id),
      supabase.from('cronograma').update({ ordem: ordA }).eq('id', b.id),
    ])
    load()
  }

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const lista = obraFiltro ? etapas.filter(e => e.obra_id === obraFiltro) : etapas

  const total       = lista.length
  const concluidas  = lista.filter(e => e.concluido).length
  const atrasadas   = lista.filter(e => !e.concluido && e.data_inicio && new Date(e.data_inicio + 'T00:00:00') < hoje).length
  const progresso   = total > 0 ? Math.round((concluidas / total) * 100) : 0

  // Agrupar por obra
  const obraMap: Record<string, { info: { nome: string; codigo: string }; etapas: any[] }> = {}
  for (const e of lista) {
    if (!obraMap[e.obra_id]) obraMap[e.obra_id] = { info: e.obras || { nome: 'Obra', codigo: '-' }, etapas: [] }
    obraMap[e.obra_id].etapas.push(e)
  }

  return (
    <>
      <Header titulo="Cronograma" subtitulo="Etapas e atividades das obras" />

      <div className="page-body">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total de etapas',  valor: total,      cor: 'text-lead-900' },
            { label: 'Concluídas',       valor: concluidas, cor: 'text-emerald-600' },
            { label: 'Atrasadas',        valor: atrasadas,  cor: 'text-red-600' },
            { label: 'Progresso geral',  valor: `${progresso}%`, cor: 'text-brand-600' },
          ].map(k => (
            <div key={k.label} className="card p-5 text-center">
              <p className={`text-2xl font-bold ${k.cor} tabular-nums`}>{k.valor}</p>
              <p className="text-xs text-lead-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <select value={obraFiltro} onChange={e => setObraFiltro(e.target.value)} className="select max-w-xs">
            <option value="">Todas as obras</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
          </select>
          <div className="flex-1" />
          <Link href="/dashboard/cronograma/novo" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova etapa
          </Link>
        </div>

        {carregando ? (
          <div className="card flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="empty-state-icon mx-auto mb-4">
              <GanttChartSquare className="w-6 h-6 text-lead-400" />
            </div>
            <p className="font-semibold text-lead-900">Nenhuma etapa cadastrada</p>
            <p className="text-sm text-lead-500 mt-1 max-w-xs">Monte o cronograma completo da obra com etapas, responsáveis e prazos.</p>
            <Link href="/dashboard/cronograma/novo" className="btn-primary mt-5">
              <Plus className="w-4 h-4" />Adicionar etapa
            </Link>
          </div>
        ) : (
          Object.entries(obraMap).map(([obraId, { info, etapas: ets }]) => (
            <div key={obraId} className="card overflow-hidden animate-fade-up">

              {/* Header da obra */}
              {!obraFiltro && (
                <div className="px-5 py-3 bg-lead-50 border-b border-lead-100 flex items-center gap-2">
                  <span className="text-xs font-bold text-lead-500 uppercase tracking-wider">{info.codigo}</span>
                  <span className="text-sm font-semibold text-lead-800">{info.nome}</span>
                  <span className="ml-auto text-xs text-lead-400">{ets.length} etapa{ets.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lead-100 bg-lead-50/50">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide w-8">#</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide min-w-[200px]">Etapa / Atividade</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide w-28">Categoria</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide w-28">Responsável</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide w-24">Início</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-lead-500 uppercase tracking-wide w-16">Dias</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide w-24">Término</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-500 uppercase tracking-wide min-w-[140px]">Observações</th>
                      <th className="px-3 py-2.5 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lead-100/80">
                    {ets.map((e, idx) => {
                      const atrasado = !e.concluido && e.data_inicio && new Date(e.data_inicio + 'T00:00:00') < hoje
                      const termino = e.data_fim || calcTermino(e.data_inicio, e.duracao_dias)

                      return (
                        <tr key={e.id}
                          className={`group transition-colors hover:bg-lead-50/60 ${atrasado ? 'bg-red-50/30' : ''} ${e.concluido ? 'opacity-60' : ''}`}>

                          {/* Ordem */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moverOrdem(e, 'up')}
                                className="opacity-0 group-hover:opacity-70 hover:!opacity-100 text-lead-400 hover:text-brand-500 transition-all">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <span className="text-xs text-lead-400 text-center tabular-nums">{e.ordem ?? idx + 1}</span>
                              <button onClick={() => moverOrdem(e, 'down')}
                                className="opacity-0 group-hover:opacity-70 hover:!opacity-100 text-lead-400 hover:text-brand-500 transition-all">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Etapa */}
                          <td className="px-3 py-2.5">
                            <p className={`font-medium leading-tight ${e.concluido ? 'line-through text-lead-400' : atrasado ? 'text-red-700' : 'text-lead-900'}`}>
                              {e.titulo}
                            </p>
                            {e.descricao && (
                              <p className="text-xs text-lead-400 mt-0.5 line-clamp-1">{e.descricao}</p>
                            )}
                            {atrasado && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <AlertCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-500 font-medium">Atrasado</span>
                              </div>
                            )}
                          </td>

                          {/* Categoria */}
                          <td className="px-3 py-2.5">
                            {e.categoria ? (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${cor(e.categoria)}`}>
                                {e.categoria}
                              </span>
                            ) : <span className="text-xs text-lead-300">—</span>}
                          </td>

                          {/* Responsável */}
                          <td className="px-3 py-2.5 text-xs text-lead-600">
                            {e.responsavel || <span className="text-lead-300">—</span>}
                          </td>

                          {/* Início */}
                          <td className="px-3 py-2.5 text-xs text-lead-700 whitespace-nowrap">{fmtData(e.data_inicio)}</td>

                          {/* Dias */}
                          <td className="px-3 py-2.5 text-xs text-lead-600 text-center">
                            {e.duracao_dias ?? <span className="text-lead-300">—</span>}
                          </td>

                          {/* Término */}
                          <td className="px-3 py-2.5 text-xs text-lead-700 whitespace-nowrap">
                            {fmtData(termino ?? undefined)}
                          </td>

                          {/* Observações */}
                          <td className="px-3 py-2.5 text-xs text-lead-500 max-w-[160px]">
                            {e.observacoes
                              ? <span className="line-clamp-2">{e.observacoes}</span>
                              : <span className="text-lead-300">—</span>
                            }
                          </td>

                          {/* Ações */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => toggleConcluido(e)}
                                title={e.concluido ? 'Marcar como pendente' : 'Concluída'}
                                className="p-1.5 rounded-md text-lead-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                {e.concluido
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  : <Circle className="w-4 h-4" />
                                }
                              </button>
                              <button
                                onClick={() => deletar(e.id)}
                                title="Excluir"
                                className="p-1.5 rounded-md text-lead-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ))
        )}

      </div>
    </>
  )
}
