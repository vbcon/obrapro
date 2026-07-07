'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

const CATEGORIAS = [
  'fundacao','estrutura','alvenaria','cobertura','instalacoes',
  'hidraulica','eletrica','revestimento','acabamento','esquadrias',
  'pintura','paisagismo','outro',
]

export default function NovaCronogramaPage() {
  const router = useRouter()
  const params = useSearchParams()
  const obraParam = params.get('obra') || ''

  const [obras, setObras]   = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [etapas, setEtapas] = useState<{ id: string; titulo: string; ordem?: number }[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    obra_id:        obraParam,
    titulo:         '',
    categoria:      '',
    responsavel:    '',
    predecessora_id:'',
    data_inicio:    new Date().toISOString().split('T')[0],
    duracao_dias:   '1',
    observacoes:    '',
    ordem:          '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('obras').select('id, nome, codigo').order('nome')
      .then(({ data }) => setObras(data || []))
  }, [])

  useEffect(() => {
    if (!form.obra_id) { setEtapas([]); return }
    const supabase = createClient()
    supabase.from('cronograma')
      .select('id, titulo, ordem')
      .eq('obra_id', form.obra_id)
      .order('ordem', { ascending: true, nullsFirst: false })
      .order('data_inicio', { ascending: true })
      .then(({ data }) => setEtapas(data || []))
  }, [form.obra_id])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione a obra.'); return }
    if (!form.titulo)  { setErro('Informe o título da etapa.'); return }
    if (!form.data_inicio) { setErro('Informe a data de início.'); return }

    setSalvando(true)
    const supabase = createClient()

    const dias = parseInt(form.duracao_dias) || 1
    const inicio = form.data_inicio
    const termino = new Date(inicio + 'T00:00:00')
    termino.setDate(termino.getDate() + dias - 1)

    const { error } = await supabase.from('cronograma').insert({
      obra_id:         form.obra_id,
      titulo:          form.titulo.trim(),
      categoria:       form.categoria || null,
      responsavel:     form.responsavel.trim() || null,
      predecessora_id: form.predecessora_id || null,
      data_inicio:     inicio,
      data_fim:        termino.toISOString().split('T')[0],
      duracao_dias:    dias,
      observacoes:     form.observacoes.trim() || null,
      ordem:           form.ordem ? parseInt(form.ordem) : null,
      concluido:       false,
    })

    if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
    router.push('/dashboard/cronograma')
    router.refresh()
  }

  const diasNum = parseInt(form.duracao_dias) || 1
  const termino = form.data_inicio
    ? (() => {
        const d = new Date(form.data_inicio + 'T00:00:00')
        d.setDate(d.getDate() + diasNum - 1)
        return d.toLocaleDateString('pt-BR')
      })()
    : '—'

  return (
    <>
      <Header titulo="Nova Etapa" subtitulo="Cronograma da obra" />

      <div className="page-body max-w-2xl">
        <Link href="/dashboard/cronograma"
          className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identificação */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>

            <div>
              <label className="label">Obra *</label>
              <select required value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="select">
                <option value="">Selecione a obra...</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Etapa / Atividade *</label>
              <input
                type="text" required
                value={form.titulo} onChange={e => set('titulo', e.target.value)}
                placeholder="Ex: Fundação — Radier, Alvenaria — 1º pavimento"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Categoria</label>
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="select">
                  <option value="">Selecione...</option>
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Responsável</label>
                <input
                  type="text"
                  value={form.responsavel} onChange={e => set('responsavel', e.target.value)}
                  placeholder="Nome do fornecedor / equipe"
                  className="input"
                />
              </div>
            </div>

            {etapas.length > 0 && (
              <div>
                <label className="label">Predecessora <span className="label-hint">etapa que precisa estar concluída antes</span></label>
                <select value={form.predecessora_id} onChange={e => set('predecessora_id', e.target.value)} className="select">
                  <option value="">Nenhuma</option>
                  {etapas.map(et => (
                    <option key={et.id} value={et.id}>
                      {et.ordem ? `${et.ordem}. ` : ''}{et.titulo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Ordem <span className="label-hint">número de sequência no cronograma</span></label>
              <input
                type="number" min="1"
                value={form.ordem} onChange={e => set('ordem', e.target.value)}
                placeholder="Ex: 1, 2, 3..."
                className="input"
              />
            </div>
          </div>

          {/* Prazo */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Prazo</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data de início *</label>
                <input
                  type="date" required
                  value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Duração (dias corridos)</label>
                <input
                  type="number" min="1"
                  value={form.duracao_dias} onChange={e => set('duracao_dias', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {form.data_inicio && (
              <div className="flex items-center gap-2 bg-lead-50 rounded-lg px-4 py-3">
                <span className="text-xs text-lead-500">Término previsto:</span>
                <span className="text-sm font-semibold text-lead-900">{termino}</span>
                <span className="text-xs text-lead-400 ml-auto">{diasNum} dia{diasNum !== 1 ? 's' : ''} corrido{diasNum !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div>
              <label className="label">Observações</label>
              <textarea
                rows={3}
                value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                placeholder="Notas sobre materiais, condições especiais, etc."
                className="textarea"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/cronograma" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Adicionar etapa</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
