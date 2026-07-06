'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react'

const TIPOS = ['residencial','comercial','industrial','reforma','outro']
const STATUS = ['planejamento','em_andamento','pausada','concluida','cancelada']
const STATUS_LABELS: Record<string, string> = { planejamento: 'Planejamento', em_andamento: 'Em andamento', pausada: 'Pausada', concluida: 'Concluída', cancelada: 'Cancelada' }
const FORMAS_PAGAMENTO = ['À vista','Parcelado','Medição mensal','Por etapa','Outro']
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function EditarObraPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', codigo: '', cliente: '', tipo: 'comercial', descricao: '',
    endereco: '', cidade: '', estado: 'DF', cep: '',
    data_inicio: '', data_prevista: '', data_conclusao: '',
    orcamento_total: '', forma_pagamento: '', condicao_pagamento: '',
    anotacoes: '', status: 'planejamento', percentual_conclusao: '0',
  })

  useEffect(() => {
    const supabase = createClient()
    setCarregando(true)
    supabase.from('obras').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { router.push('/dashboard/obras'); return }
      setForm({
        nome: data.nome || '',
        codigo: data.codigo || '',
        cliente: data.cliente || '',
        tipo: data.tipo || 'comercial',
        descricao: data.descricao || '',
        endereco: data.endereco || '',
        cidade: data.cidade || '',
        estado: data.estado || 'DF',
        cep: data.cep || '',
        data_inicio: data.data_inicio || '',
        data_prevista: data.data_prevista || '',
        data_conclusao: data.data_conclusao || '',
        orcamento_total: data.orcamento_total?.toString() || '',
        forma_pagamento: data.forma_pagamento || '',
        condicao_pagamento: data.condicao_pagamento || '',
        anotacoes: data.anotacoes || '',
        status: data.status || 'planejamento',
        percentual_conclusao: data.percentual_conclusao?.toString() || '0',
      })
      setCarregando(false)
    })
  }, [id, router])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.nome || !form.cliente) { setErro('Nome e cliente são obrigatórios.'); return }
    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.from('obras').update({
      nome: form.nome,
      codigo: form.codigo,
      cliente: form.cliente,
      tipo: form.tipo,
      descricao: form.descricao || null,
      endereco: form.endereco || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      cep: form.cep || null,
      data_inicio: form.data_inicio || null,
      data_prevista: form.data_prevista || null,
      data_conclusao: form.data_conclusao || null,
      orcamento_total: parseFloat(form.orcamento_total) || 0,
      forma_pagamento: form.forma_pagamento || null,
      condicao_pagamento: form.condicao_pagamento || null,
      anotacoes: form.anotacoes || null,
      status: form.status,
      percentual_conclusao: parseInt(form.percentual_conclusao) || 0,
    }).eq('id', id)

    if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
    router.push(`/dashboard/obras/${id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    await supabase.from('obras').delete().eq('id', id)
    router.push('/dashboard/obras')
    router.refresh()
  }

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <>
      <Header titulo="Editar Obra" subtitulo="Atualize os dados do projeto" />
      <div className="p-6 max-w-3xl">
        <Link href={`/dashboard/obras/${id}`} className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Status da Obra</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  {STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Progresso (%)</label>
                <input type="number" min="0" max="100" value={form.percentual_conclusao} onChange={e => set('percentual_conclusao', e.target.value)} className="input" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Dados da Obra</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome *</label>
                <input type="text" required value={form.nome} onChange={e => set('nome', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Código</label>
                <input type="text" value={form.codigo} onChange={e => set('codigo', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Cliente *</label>
                <input type="text" required value={form.cliente} onChange={e => set('cliente', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Descrição</label>
                <textarea rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Localização</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="label">Endereço</label>
                <input type="text" value={form.endereco} onChange={e => set('endereco', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Cidade</label>
                <input type="text" value={form.cidade} onChange={e => set('cidade', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Estado</label>
                <select value={form.estado} onChange={e => set('estado', e.target.value)} className="input">
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Prazo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Início</label>
                <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Prazo previsto</label>
                <input type="date" value={form.data_prevista} onChange={e => set('data_prevista', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Conclusão real</label>
                <input type="date" value={form.data_conclusao} onChange={e => set('data_conclusao', e.target.value)} className="input" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Contrato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Valor do Contrato (R$)</label>
                <input type="number" step="0.01" min="0" value={form.orcamento_total} onChange={e => set('orcamento_total', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)} className="input">
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Condições de Pagamento</label>
                <input type="text" value={form.condicao_pagamento} onChange={e => set('condicao_pagamento', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Anotações</label>
                <textarea rows={3} value={form.anotacoes} onChange={e => set('anotacoes', e.target.value)} className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
              <Trash2 className="w-4 h-4" />
              Excluir obra
            </button>
            <div className="flex gap-3">
              <Link href={`/dashboard/obras/${id}`} className="btn-secondary">Cancelar</Link>
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                ) : (
                  <><Save className="w-4 h-4" />Salvar alterações</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
