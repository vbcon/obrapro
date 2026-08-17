'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react'

const CATEGORIAS = [
  'fundacao','estrutura','alvenaria','cobertura','instalacoes',
  'hidraulica','eletrica','revestimento','acabamento','esquadrias',
  'pintura','paisagismo','outro',
]

export default function EditarEtapaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [obraNome, setObraNome] = useState('')

  const [form, setForm] = useState({
    titulo: '', categoria: '', responsavel: '',
    data_inicio: '', duracao_dias: '1', observacoes: '', concluido: false,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('cronograma').select('*, obras(nome, codigo)').eq('id', id).single()
      .then(({ data }) => {
        if (!data) { setErro('Etapa não encontrada.'); setCarregando(false); return }
        setObraNome(data.obras ? `${data.obras.codigo} — ${data.obras.nome}` : '')
        setForm({
          titulo:       data.titulo || '',
          categoria:    data.categoria || '',
          responsavel:  data.responsavel || '',
          data_inicio:  data.data_inicio ? data.data_inicio.slice(0, 10) : '',
          duracao_dias: String(data.duracao_dias || 1),
          observacoes:  data.observacoes || '',
          concluido:    !!data.concluido,
        })
        setCarregando(false)
      })
  }, [id])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  const diasNum = parseInt(form.duracao_dias) || 1
  const termino = form.data_inicio
    ? (() => {
        const d = new Date(form.data_inicio + 'T00:00:00')
        d.setDate(d.getDate() + diasNum - 1)
        return d.toLocaleDateString('pt-BR')
      })()
    : '—'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.titulo.trim())  { setErro('Informe o título da etapa.'); return }
    if (!form.data_inicio)    { setErro('Informe a data de início.'); return }

    setSalvando(true)
    const supabase = createClient()

    const terminoDate = new Date(form.data_inicio + 'T00:00:00')
    terminoDate.setDate(terminoDate.getDate() + diasNum - 1)

    const { error } = await supabase.from('cronograma').update({
      titulo:       form.titulo.trim(),
      categoria:    form.categoria || null,
      responsavel:  form.responsavel.trim() || null,
      data_inicio:  form.data_inicio,
      data_fim:     terminoDate.toISOString().split('T')[0],
      duracao_dias: diasNum,
      observacoes:  form.observacoes.trim() || null,
    }).eq('id', id)

    if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
    router.push('/dashboard/cronograma')
    router.refresh()
  }

  async function excluir() {
    if (!confirm('Excluir esta etapa? Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    await supabase.from('cronograma').delete().eq('id', id)
    router.push('/dashboard/cronograma')
    router.refresh()
  }

  if (carregando) {
    return (
      <>
        <Header titulo="Editar Etapa" subtitulo="Cronograma da obra" />
        <div className="page-body flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header titulo="Editar Etapa" subtitulo={obraNome || 'Cronograma da obra'} />

      <div className="page-body max-w-2xl">
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

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>

            <div>
              <label className="label">Etapa / Atividade *</label>
              <input type="text" required value={form.titulo}
                onChange={e => set('titulo', e.target.value)}
                placeholder="Ex: Fundação — Radier" className="input" />
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
                <input type="text" value={form.responsavel}
                  onChange={e => set('responsavel', e.target.value)}
                  placeholder="Equipe / fornecedor" className="input" />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Prazo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data de início *</label>
                <input type="date" required value={form.data_inicio}
                  onChange={e => set('data_inicio', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Duração (dias corridos)</label>
                <input type="number" min="1" value={form.duracao_dias}
                  onChange={e => set('duracao_dias', e.target.value)} className="input" />
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
              <textarea rows={3} value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                placeholder="Notas sobre materiais, condições especiais, etc." className="textarea" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={excluir}
              className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />Excluir etapa
            </button>
            <div className="flex gap-3">
              <Link href="/dashboard/cronograma" className="btn-secondary">Cancelar</Link>
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                  : <><Save className="w-4 h-4" />Salvar alterações</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
