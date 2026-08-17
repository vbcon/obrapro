'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'

const CATEGORIAS = [
  'fundacao','estrutura','alvenaria','cobertura','instalacoes',
  'hidraulica','eletrica','revestimento','acabamento','esquadrias',
  'pintura','paisagismo','outro',
]

type TipoInicio = 'apos_anterior' | 'junto_com_anterior' | 'data_especifica'

interface Linha {
  id:           number
  titulo:       string
  categoria:    string
  responsavel:  string
  dias:         string
  tipoInicio:   TipoInicio
  dataEspecifica: string
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function fmtData(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function calcDatas(linhas: Linha[], dataInicio: string): { inicio: string; fim: string }[] {
  const resultado: { inicio: string; fim: string }[] = []
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    const dias  = Math.max(1, parseInt(linha.dias) || 1)
    let inicio: string

    if (i === 0) {
      inicio = dataInicio
    } else {
      const anterior = resultado[i - 1]
      if (linha.tipoInicio === 'junto_com_anterior') {
        inicio = anterior.inicio
      } else if (linha.tipoInicio === 'data_especifica') {
        inicio = linha.dataEspecifica || anterior.fim
      } else {
        inicio = addDays(anterior.fim, 1)
      }
    }

    const fim = addDays(inicio, dias - 1)
    resultado.push({ inicio, fim })
  }
  return resultado
}

let nextId = 1
function novaLinha(tipoInicio: TipoInicio = 'apos_anterior'): Linha {
  return {
    id: nextId++, titulo: '', categoria: '', responsavel: '',
    dias: '7', tipoInicio, dataEspecifica: '',
  }
}

export default function NovaCronogramaPage() {
  const router      = useRouter()
  const params      = useSearchParams()
  const obraParam   = params.get('obra') || ''

  const [obras, setObras]     = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [obraId, setObraId]   = useState(obraParam)
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [linhas, setLinhas]   = useState<Linha[]>([novaLinha('apos_anterior')])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]       = useState('')

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome')
      .then(({ data }) => setObras(data || []))
  }, [])

  function setLinha(id: number, campo: keyof Linha, valor: string) {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l))
  }

  function adicionarLinha() {
    setLinhas(prev => [...prev, novaLinha('apos_anterior')])
  }

  function removerLinha(id: number) {
    setLinhas(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!obraId) { setErro('Selecione a obra.'); return }
    const vazias = linhas.filter(l => !l.titulo.trim())
    if (vazias.length > 0) { setErro('Preencha o título de todas as etapas.'); return }

    setSalvando(true)
    const supabase = createClient()
    const datas = calcDatas(linhas, dataInicio)

    const registros = linhas.map((l, i) => ({
      obra_id:      obraId,
      titulo:       l.titulo.trim(),
      categoria:    l.categoria || null,
      responsavel:  l.responsavel.trim() || null,
      data_inicio:  datas[i].inicio,
      data_fim:     datas[i].fim,
      duracao_dias: Math.max(1, parseInt(l.dias) || 1),
      ordem:        i + 1,
      concluido:    false,
    }))

    const { error } = await supabase.from('cronograma').insert(registros)
    if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
    router.push('/dashboard/cronograma')
    router.refresh()
  }

  const datas = dataInicio ? calcDatas(linhas, dataInicio) : null

  return (
    <>
      <Header titulo="Novo Cronograma" subtitulo="Adicione todas as etapas de uma vez" />

      <div className="page-body">
        <Link href="/dashboard/cronograma"
          className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Obra + data de início */}
          <div className="card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Obra *</label>
                <select required value={obraId} onChange={e => setObraId(e.target.value)} className="select">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data de início da 1ª etapa *</label>
                <input type="date" required value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Tabela de etapas */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-lead-50 border-b border-lead-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-lead-800">
                Etapas ({linhas.length})
              </span>
              <button type="button" onClick={adicionarLinha} className="btn-ghost btn-sm">
                <Plus className="w-3.5 h-3.5" />
                Adicionar linha
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-lead-100">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 min-w-[220px]">Etapa / Atividade *</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-32">Categoria</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-32">Responsável</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-lead-400 w-20">Dias</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-40">Início</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-24">Término</th>
                    <th className="px-3 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lead-100/60">
                  {linhas.map((linha, idx) => {
                    const dt = datas?.[idx]
                    return (
                      <tr key={linha.id} className="hover:bg-lead-50/40 transition-colors">

                        <td className="px-3 py-2 text-xs text-lead-400 text-center font-medium">{idx + 1}</td>

                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={linha.titulo}
                            onChange={e => setLinha(linha.id, 'titulo', e.target.value)}
                            placeholder="Ex: Fundação, Alvenaria..."
                            className="input input-sm w-full"
                            required
                          />
                        </td>

                        <td className="px-3 py-2">
                          <select
                            value={linha.categoria}
                            onChange={e => setLinha(linha.id, 'categoria', e.target.value)}
                            className="select select-sm w-full"
                          >
                            <option value="">—</option>
                            {CATEGORIAS.map(c => (
                              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={linha.responsavel}
                            onChange={e => setLinha(linha.id, 'responsavel', e.target.value)}
                            placeholder="Equipe / fornecedor"
                            className="input input-sm w-full"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            type="number" min="1"
                            value={linha.dias}
                            onChange={e => setLinha(linha.id, 'dias', e.target.value)}
                            className="input input-sm w-full text-center"
                          />
                        </td>

                        {/* Início */}
                        <td className="px-3 py-2">
                          {idx === 0 ? (
                            <span className="text-xs font-medium text-lead-700 px-1">
                              {dt ? fmtData(dt.inicio) : '—'}
                            </span>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex rounded-lg border border-lead-200 overflow-hidden text-[11px] font-medium">
                                <button type="button"
                                  onClick={() => setLinha(linha.id, 'tipoInicio', 'apos_anterior')}
                                  className={`flex-1 px-2 py-1 transition-colors ${linha.tipoInicio === 'apos_anterior' ? 'bg-brand-500 text-white' : 'bg-white text-lead-500 hover:bg-lead-50'}`}>
                                  Após
                                </button>
                                <button type="button"
                                  onClick={() => setLinha(linha.id, 'tipoInicio', 'junto_com_anterior')}
                                  className={`flex-1 px-2 py-1 border-x border-lead-200 transition-colors ${linha.tipoInicio === 'junto_com_anterior' ? 'bg-brand-500 text-white' : 'bg-white text-lead-500 hover:bg-lead-50'}`}>
                                  Junto
                                </button>
                                <button type="button"
                                  onClick={() => setLinha(linha.id, 'tipoInicio', 'data_especifica')}
                                  className={`flex-1 px-2 py-1 transition-colors ${linha.tipoInicio === 'data_especifica' ? 'bg-brand-500 text-white' : 'bg-white text-lead-500 hover:bg-lead-50'}`}>
                                  Data
                                </button>
                              </div>
                              {linha.tipoInicio === 'data_especifica' ? (
                                <input type="date"
                                  value={linha.dataEspecifica}
                                  onChange={e => setLinha(linha.id, 'dataEspecifica', e.target.value)}
                                  className="input input-sm w-full" />
                              ) : (
                                <span className="text-xs font-medium text-lead-600 px-1">
                                  {dt ? fmtData(dt.inicio) : '—'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Término */}
                        <td className="px-3 py-2">
                          <span className="text-xs font-medium text-lead-600">
                            {dt ? fmtData(dt.fim) : '—'}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <button type="button" onClick={() => removerLinha(linha.id)}
                            disabled={linhas.length === 1}
                            className="p-1.5 rounded text-lead-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-lead-100 flex items-center justify-between bg-lead-50/50">
              <button type="button" onClick={adicionarLinha}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Adicionar linha
              </button>
              {datas && datas.length > 0 && (
                <span className="text-xs text-lead-400">
                  Total: {linhas.reduce((s, l) => s + Math.max(1, parseInt(l.dias) || 1), 0)} dias corridos ·
                  Término: {fmtData(datas[datas.length - 1].fim)}/{new Date(datas[datas.length - 1].fim + 'T00:00:00').getFullYear()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/cronograma" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Salvar {linhas.length} etapa{linhas.length !== 1 ? 's' : ''}</>
              }
            </button>
          </div>

        </form>
      </div>
    </>
  )
}
