'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

export default function NovoCronogramaPage() {
  const router = useRouter()
  const params = useSearchParams()
  const obraParam = params.get('obra') || ''

  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    obra_id: obraParam,
    titulo: '',
    tipo: 'marco',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    descricao: '',
  })

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome').then(({ data }) => setObras(data || []))
  }, [])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione uma obra.'); return }
    if (!form.titulo) { setErro('Informe o título do evento.'); return }
    if (!form.data_inicio) { setErro('Informe a data.'); return }

    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.from('cronograma').insert({
      obra_id: form.obra_id,
      titulo: form.titulo,
      tipo: form.tipo,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      descricao: form.descricao || null,
      concluido: false,
    })

    if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
    router.push('/dashboard/cronograma')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Novo Evento" subtitulo="Cronograma da obra" />

      <div className="p-6 max-w-2xl">
        <Link href="/dashboard/cronograma" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="input">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">Título *</label>
                <input type="text" required value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Vistoria de fundação" className="input" />
              </div>

              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                  <option value="marco">🚩 Marco</option>
                  <option value="entrega">🚚 Entrega</option>
                  <option value="reuniao">👥 Reunião</option>
                  <option value="vistoria">👁 Vistoria</option>
                  <option value="pagamento">💳 Pagamento</option>
                  <option value="outro">📌 Outro</option>
                </select>
              </div>

              <div>
                <label className="label">Data *</label>
                <input type="date" required value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Data fim <span className="text-lead-400 font-normal">(opcional)</span></label>
                <input type="date" value={form.data_fim} onChange={e => set('data_fim', e.target.value)} className="input" min={form.data_inicio} />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Descrição</label>
                <textarea rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Detalhes do evento..." className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/cronograma" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Salvar evento</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
