'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Trash2, Plus, Trash } from 'lucide-react'

const STATUS = ['aberta','em_cotacao','aprovada','convertida','cancelada']
const STATUS_LABELS: Record<string, string> = { aberta: 'Aberta', em_cotacao: 'Em cotação', aprovada: 'Aprovada', convertida: 'OC Gerada', cancelada: 'Cancelada' }

export default function EditarCompraPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [form, setForm] = useState({ obra_id: '', titulo: '', descricao: '', urgencia: 'media', status: 'aberta', data_necessidade: '', observacoes: '' })
  const [itens, setItens] = useState<{ descricao: string; unidade: string; quantidade: string; observacao: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('solicitacoes_compra').select('*').eq('id', id).single(),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ]).then(([{ data }, { data: obrasData }]) => {
      if (!data) { router.push('/dashboard/compras'); return }
      setForm({ obra_id: data.obra_id, titulo: data.titulo, descricao: data.descricao || '', urgencia: data.urgencia, status: data.status, data_necessidade: data.data_necessidade || '', observacoes: data.observacoes || '' })
      setItens((data.itens || []).map((i: any) => ({ descricao: i.descricao, unidade: i.unidade || 'un', quantidade: String(i.quantidade || 1), observacao: i.observacao || '' })))
      setObras(obrasData || [])
      setCarregando(false)
    })
  }, [id, router])

  function setField(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }
  function setItem(index: number, field: string, value: string) { setItens(p => p.map((it, i) => i === index ? { ...it, [field]: value } : it)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.from('solicitacoes_compra').update({
      obra_id: form.obra_id,
      titulo: form.titulo,
      descricao: form.descricao || null,
      urgencia: form.urgencia,
      status: form.status,
      data_necessidade: form.data_necessidade || null,
      observacoes: form.observacoes || null,
      itens: itens.map(i => ({ descricao: i.descricao, unidade: i.unidade, quantidade: parseFloat(i.quantidade) || 1, observacao: i.observacao })),
    }).eq('id', id)
    if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
    router.push('/dashboard/compras')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Excluir esta solicitação?')) return
    const supabase = createClient()
    await supabase.from('solicitacoes_compra').delete().eq('id', id)
    router.push('/dashboard/compras')
    router.refresh()
  }

  if (carregando) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>

  return (
    <>
      <Header titulo="Editar Solicitação" subtitulo="Atualize os dados da solicitação" />
      <div className="p-6 max-w-3xl">
        <Link href="/dashboard/compras" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6"><ArrowLeft className="w-4 h-4" />Voltar</Link>

        {erro && <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6"><AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><p className="text-red-700 text-sm">{erro}</p></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra</label>
                <select value={form.obra_id} onChange={e => setField('obra_id', e.target.value)} className="input">
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Título</label>
                <input type="text" required value={form.titulo} onChange={e => setField('titulo', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className="input">
                  {STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Urgência</label>
                <select value={form.urgencia} onChange={e => setField('urgencia', e.target.value)} className="input">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="label">Data necessária</label>
                <input type="date" value={form.data_necessidade} onChange={e => setField('data_necessidade', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Observações</label>
                <textarea rows={2} value={form.observacoes} onChange={e => setField('observacoes', e.target.value)} className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lead-900">Itens</h2>
              <button type="button" onClick={() => setItens(p => [...p, { descricao: '', unidade: 'un', quantidade: '1', observacao: '' }])} className="btn-ghost text-sm py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {itens.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-lead-50 rounded-lg">
                  <div className="col-span-5">
                    <label className="label text-xs">Descrição</label>
                    <input type="text" value={item.descricao} onChange={e => setItem(index, 'descricao', e.target.value)} className="input text-sm py-2" />
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Unid.</label>
                    <select value={item.unidade} onChange={e => setItem(index, 'unidade', e.target.value)} className="input text-sm py-2">
                      {['un','m','m²','m³','kg','lt','cx','pç','sc','vb'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Qtd</label>
                    <input type="number" value={item.quantidade} onChange={e => setItem(index, 'quantidade', e.target.value)} className="input text-sm py-2" />
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Obs</label>
                    <input type="text" value={item.observacao} onChange={e => setItem(index, 'observacao', e.target.value)} className="input text-sm py-2" />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-0.5">
                    <button type="button" onClick={() => setItens(p => p.filter((_, i) => i !== index))} disabled={itens.length === 1} className="p-2 text-lead-400 hover:text-red-500 disabled:opacity-30">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />Excluir
            </button>
            <div className="flex gap-3">
              <Link href="/dashboard/compras" className="btn-secondary">Cancelar</Link>
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</> : <><Save className="w-4 h-4" />Salvar</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
