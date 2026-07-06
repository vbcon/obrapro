'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'

interface Item { descricao: string; unidade: string; quantidade: string; observacao: string }

export default function NovaCompraPage() {
  const router = useRouter()
  const params = useSearchParams()
  const obraParam = params.get('obra') || ''

  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    obra_id: obraParam,
    titulo: '',
    descricao: '',
    urgencia: 'media',
    data_necessidade: '',
    observacoes: '',
  })

  const [itens, setItens] = useState<Item[]>([
    { descricao: '', unidade: 'un', quantidade: '1', observacao: '' }
  ])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('obras').select('id, nome, codigo').order('nome').then(({ data }) => {
      setObras(data || [])
    })
  }, [])

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setItem(index: number, field: keyof Item, value: string) {
    setItens(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItens(prev => [...prev, { descricao: '', unidade: 'un', quantidade: '1', observacao: '' }])
  }

  function removeItem(index: number) {
    if (itens.length === 1) return
    setItens(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.obra_id) { setErro('Selecione uma obra.'); return }
    if (!form.titulo) { setErro('Informe o título da solicitação.'); return }
    if (itens.some(i => !i.descricao)) { setErro('Preencha a descrição de todos os itens.'); return }

    setCarregando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('solicitacoes_compra').insert({
      obra_id: form.obra_id,
      titulo: form.titulo,
      descricao: form.descricao || null,
      urgencia: form.urgencia,
      data_necessidade: form.data_necessidade || null,
      observacoes: form.observacoes || null,
      itens: itens.map(i => ({
        descricao: i.descricao,
        unidade: i.unidade,
        quantidade: parseFloat(i.quantidade) || 1,
        observacao: i.observacao,
      })),
      solicitado_por: user?.id,
      status: 'aberta',
    })

    if (error) {
      setErro('Erro ao criar solicitação. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/dashboard/compras')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Nova Solicitação" subtitulo="Solicitação de materiais para obra" />

      <div className="p-6 max-w-3xl">
        <Link href="/dashboard/compras" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados da Solicitação</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => setField('obra_id', e.target.value)} className="input">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Título da Solicitação *</label>
                <input type="text" required value={form.titulo} onChange={e => setField('titulo', e.target.value)} placeholder="Ex: Materiais hidráulicos — 1ª etapa" className="input" />
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
                <label className="label">Data Necessária</label>
                <input type="date" value={form.data_necessidade} onChange={e => setField('data_necessidade', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Descrição / Justificativa</label>
                <textarea rows={3} value={form.descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Contexto da solicitação..." className="input resize-none" />
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lead-900">Itens Solicitados</h2>
              <button type="button" onClick={addItem} className="btn-ghost text-sm py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />
                Adicionar item
              </button>
            </div>

            <div className="space-y-3">
              {itens.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-lead-50 rounded-lg">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="label text-xs">Descrição *</label>
                    <input type="text" required value={item.descricao} onChange={e => setItem(index, 'descricao', e.target.value)} placeholder="Ex: Tubo PVC 100mm" className="input text-sm py-2" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label text-xs">Unidade</label>
                    <select value={item.unidade} onChange={e => setItem(index, 'unidade', e.target.value)} className="input text-sm py-2">
                      {['un','m','m²','m³','kg','lt','cx','pç','sc','vb'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label text-xs">Qtd</label>
                    <input type="number" min="0.01" step="0.01" value={item.quantidade} onChange={e => setItem(index, 'quantidade', e.target.value)} className="input text-sm py-2" />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="label text-xs">Obs</label>
                    <input type="text" value={item.observacao} onChange={e => setItem(index, 'observacao', e.target.value)} placeholder="..." className="input text-sm py-2" />
                  </div>
                  <div className="col-span-1 flex items-end justify-center pb-0.5">
                    <button type="button" onClick={() => removeItem(index)} disabled={itens.length === 1} className="p-2 text-lead-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <label className="label">Observações gerais</label>
            <textarea rows={3} value={form.observacoes} onChange={e => setField('observacoes', e.target.value)} placeholder="Informações adicionais para o comprador..." className="input resize-none" />
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/compras" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={carregando} className="btn-primary">
              {carregando ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</>
              ) : (
                <><Save className="w-4 h-4" />Enviar Solicitação</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
