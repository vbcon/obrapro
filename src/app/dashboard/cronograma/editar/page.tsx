'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface Linha {
  key:         number
  id?:         string      // etapa existente (sem id = nova)
  titulo:      string
  categoria:   string
  responsavel: string
  data_inicio: string
  dias:        string
  concluido:   boolean
}

let nextKey = 1

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function termino(inicio: string, dias: number): string {
  if (!inicio) return ''
  return addDays(inicio, Math.max(1, dias) - 1)
}

function fmtData(d: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function EditarCronogramaPage() {
  const router = useRouter()
  const params = useSearchParams()

  const [obras, setObras]     = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [obraId, setObraId]   = useState(params.get('obra') || '')
  const [linhas, setLinhas]   = useState<Linha[]>([])
  const [removidos, setRemovidos] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]       = useState('')

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome')
      .then(({ data }) => setObras(data || []))
  }, [])

  const carregarEtapas = useCallback(async (id: string) => {
    if (!id) { setLinhas([]); setRemovidos([]); return }
    setCarregando(true)
    const { data } = await createClient()
      .from('cronograma')
      .select('id, titulo, categoria, responsavel, data_inicio, duracao_dias, concluido, ordem')
      .eq('obra_id', id)
      .order('ordem', { ascending: true, nullsFirst: false })
      .order('data_inicio', { ascending: true })

    setLinhas((data || []).map((e: any) => ({
      key:         nextKey++,
      id:          e.id,
      titulo:      e.titulo || '',
      categoria:   e.categoria || '',
      responsavel: e.responsavel || '',
      data_inicio: e.data_inicio ? e.data_inicio.slice(0, 10) : '',
      dias:        String(e.duracao_dias || 1),
      concluido:   !!e.concluido,
    })))
    setRemovidos([])
    setCarregando(false)
  }, [])

  useEffect(() => { carregarEtapas(obraId) }, [obraId, carregarEtapas])

  function setLinha(key: number, campo: keyof Linha, valor: string) {
    setLinhas(prev => prev.map(l => l.key === key ? { ...l, [campo]: valor } : l))
  }

  function adicionarLinha() {
    setLinhas(prev => {
      const ultima = prev[prev.length - 1]
      const inicioPadrao = ultima?.data_inicio
        ? addDays(termino(ultima.data_inicio, parseInt(ultima.dias) || 1), 1)
        : new Date().toISOString().split('T')[0]
      return [...prev, {
        key: nextKey++, titulo: '', categoria: '', responsavel: '',
        data_inicio: inicioPadrao, dias: '7', concluido: false,
      }]
    })
  }

  function removerLinha(key: number) {
    setLinhas(prev => {
      const linha = prev.find(l => l.key === key)
      if (linha?.id) setRemovidos(r => [...r, linha.id!])
      return prev.filter(l => l.key !== key)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!obraId) { setErro('Selecione a obra.'); return }
    if (linhas.some(l => !l.titulo.trim())) { setErro('Preencha o título de todas as etapas.'); return }
    if (linhas.some(l => !l.data_inicio))   { setErro('Informe a data de início de todas as etapas.'); return }

    setSalvando(true)
    const supabase = createClient()

    const paraAtualizar = linhas.filter(l => l.id)
    const paraInserir   = linhas.filter(l => !l.id)

    const ops: PromiseLike<any>[] = []

    // Excluir removidos
    if (removidos.length > 0) {
      ops.push(supabase.from('cronograma').delete().in('id', removidos))
    }

    // Atualizar existentes
    linhas.forEach((l, idx) => {
      const dias = Math.max(1, parseInt(l.dias) || 1)
      const payload = {
        titulo:       l.titulo.trim(),
        categoria:    l.categoria || null,
        responsavel:  l.responsavel.trim() || null,
        data_inicio:  l.data_inicio,
        data_fim:     termino(l.data_inicio, dias),
        duracao_dias: dias,
        ordem:        idx + 1,
      }
      if (l.id) {
        ops.push(supabase.from('cronograma').update(payload).eq('id', l.id))
      }
    })

    // Inserir novos
    if (paraInserir.length > 0) {
      const registros = paraInserir.map(l => {
        const idx = linhas.findIndex(x => x.key === l.key)
        const dias = Math.max(1, parseInt(l.dias) || 1)
        return {
          obra_id:      obraId,
          titulo:       l.titulo.trim(),
          categoria:    l.categoria || null,
          responsavel:  l.responsavel.trim() || null,
          data_inicio:  l.data_inicio,
          data_fim:     termino(l.data_inicio, dias),
          duracao_dias: dias,
          ordem:        idx + 1,
          concluido:    false,
        }
      })
      ops.push(supabase.from('cronograma').insert(registros))
    }

    const resultados = await Promise.all(ops)
    const falhou = resultados.some(r => r?.error)
    if (falhou) {
      setErro('Erro ao salvar algumas etapas. Tente novamente.')
      setSalvando(false)
      return
    }

    router.push('/dashboard/cronograma')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Editar Cronograma" subtitulo="Edite e adicione etapas da obra" />

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

          {/* Obra */}
          <div className="card p-5">
            <label className="label">Obra *</label>
            <select required value={obraId} onChange={e => setObraId(e.target.value)} className="select max-w-md">
              <option value="">Selecione a obra...</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
            </select>
          </div>

          {obraId && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-lead-50 border-b border-lead-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-lead-800">
                  Etapas ({linhas.length})
                </span>
                <button type="button" onClick={adicionarLinha} className="btn-ghost btn-sm">
                  <Plus className="w-3.5 h-3.5" />Adicionar etapa
                </button>
              </div>

              {carregando ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
                </div>
              ) : linhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-lead-500">Esta obra ainda não tem etapas.</p>
                  <button type="button" onClick={adicionarLinha} className="btn-primary btn-sm mt-4">
                    <Plus className="w-3.5 h-3.5" />Adicionar primeira etapa
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-lead-100">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-8">#</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 min-w-[220px]">Etapa / Atividade *</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-32">Categoria</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-32">Responsável</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-36">Início *</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-lead-400 w-20">Dias</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-lead-400 w-24">Término</th>
                        <th className="px-3 py-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lead-100/60">
                      {linhas.map((l, idx) => {
                        const dias = Math.max(1, parseInt(l.dias) || 1)
                        return (
                          <tr key={l.key} className={`hover:bg-lead-50/40 transition-colors ${l.concluido ? 'opacity-60' : ''}`}>
                            <td className="px-3 py-2 text-xs text-lead-400 text-center font-medium">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input type="text" value={l.titulo} required
                                onChange={e => setLinha(l.key, 'titulo', e.target.value)}
                                placeholder="Ex: Fundação, Alvenaria..." className="input input-sm w-full" />
                            </td>
                            <td className="px-3 py-2">
                              <select value={l.categoria} onChange={e => setLinha(l.key, 'categoria', e.target.value)}
                                className="select select-sm w-full">
                                <option value="">—</option>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input type="text" value={l.responsavel}
                                onChange={e => setLinha(l.key, 'responsavel', e.target.value)}
                                placeholder="Equipe / fornecedor" className="input input-sm w-full" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="date" value={l.data_inicio} required
                                onChange={e => setLinha(l.key, 'data_inicio', e.target.value)}
                                className="input input-sm w-full" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="1" value={l.dias}
                                onChange={e => setLinha(l.key, 'dias', e.target.value)}
                                className="input input-sm w-full text-center" />
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-medium text-lead-600">
                                {l.data_inicio ? fmtData(termino(l.data_inicio, dias)) : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <button type="button" onClick={() => removerLinha(l.key)}
                                className="p-1.5 rounded text-lead-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {linhas.length > 0 && (
                <div className="px-5 py-3 border-t border-lead-100 bg-lead-50/50">
                  <button type="button" onClick={adicionarLinha}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" />Adicionar etapa
                  </button>
                </div>
              )}
            </div>
          )}

          {obraId && (
            <div className="flex gap-3 justify-end">
              <Link href="/dashboard/cronograma" className="btn-secondary">Cancelar</Link>
              <button type="submit" disabled={salvando || carregando} className="btn-primary">
                {salvando
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                  : <><Save className="w-4 h-4" />Salvar cronograma</>
                }
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  )
}
