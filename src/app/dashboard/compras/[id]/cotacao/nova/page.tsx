'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

export default function NovaCotacaoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sol, setSol] = useState<any>(null)
  const [form, setForm] = useState({
    fornecedor_nome: '', fornecedor_contato: '',
    prazo_entrega: '', validade_proposta: '',
    condicao_pagamento: '', observacoes: '',
  })
  const [itens, setItens] = useState<{ descricao: string; unidade: string; quantidade: string; valor_unitario: string; valor_total: string }[]>([])

  useEffect(() => {
    createClient().from('solicitacoes_compra').select('*, obras(nome, codigo)').eq('id', id).single().then(({ data }) => {
      if (!data) return
      setSol(data)
      setItens((data.itens || []).map((item: any) => ({
        descricao: item.descricao,
        unidade: item.unidade || 'un',
        quantidade: String(item.quantidade || 1),
        valor_unitario: '',
        valor_total: '',
      })))
    })
  }, [id])

  function setField(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function setItem(index: number, field: string, value: string) {
    setItens(prev => prev.map((it, i) => {
      if (i !== index) return it
      const updated = { ...it, [field]: value }
      if (field === 'valor_unitario') {
        const total = parseFloat(updated.valor_unitario) * parseFloat(updated.quantidade)
        updated.valor_total = isNaN(total) ? '' : total.toFixed(2)
      }
      if (field === 'valor_total') {
        const unit = parseFloat(updated.valor_total) / parseFloat(updated.quantidade)
        updated.valor_unitario = isNaN(unit) ? '' : unit.toFixed(2)
      }
      return updated
    }))
  }

  const valorTotal = itens.reduce((acc, it) => acc + (parseFloat(it.valor_total) || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.fornecedor_nome) { setErro('Informe o nome do fornecedor.'); return }
    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('cotacoes').insert({
      solicitacao_id: id,
      fornecedor_nome: form.fornecedor_nome,
      fornecedor_contato: form.fornecedor_contato || null,
      valor_total: valorTotal || null,
      itens: itens.map(it => ({
        descricao: it.descricao,
        unidade: it.unidade,
        quantidade: parseFloat(it.quantidade) || 1,
        valor_unitario: parseFloat(it.valor_unitario) || 0,
        valor_total: parseFloat(it.valor_total) || 0,
      })),
      prazo_entrega: form.prazo_entrega || null,
      validade_proposta: form.validade_proposta || null,
      condicao_pagamento: form.condicao_pagamento || null,
      observacoes: form.observacoes || null,
      criado_por: user?.id,
    })
    if (error) { setErro('Erro ao salvar proposta.'); setSalvando(false); return }
    // Atualiza status da solicitação para em_cotacao se ainda estava aberta
    await supabase.from('solicitacoes_compra')
      .update({ status: 'em_cotacao' })
      .eq('id', id)
      .eq('status', 'aberta')
    router.push(`/dashboard/compras/${id}`)
    router.refresh()
  }

  function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }

  return (
    <>
      <Header titulo="Lançar Proposta" subtitulo={sol ? `${sol.obras?.codigo ? sol.obras.codigo + ' · ' : ''}${sol.titulo}` : 'Carregando...'} />
      <div className="p-6 max-w-3xl">
        <Link href={`/dashboard/compras/${id}`} className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6"><ArrowLeft className="w-4 h-4" />Voltar</Link>

        {erro && <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6"><AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><p className="text-red-700 text-sm">{erro}</p></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fornecedor */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Fornecedor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome do fornecedor *</label>
                <input type="text" required value={form.fornecedor_nome} onChange={e => setField('fornecedor_nome', e.target.value)} placeholder="Ex: Distribuidora ABC, João Material..." className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Contato (telefone / e-mail)</label>
                <input type="text" value={form.fornecedor_contato} onChange={e => setField('fornecedor_contato', e.target.value)} placeholder="(61) 99999-0000 ou fornecedor@email.com" className="input" />
              </div>
              <div>
                <label className="label">Prazo de entrega</label>
                <input type="date" value={form.prazo_entrega} onChange={e => setField('prazo_entrega', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Validade da proposta</label>
                <input type="date" value={form.validade_proposta} onChange={e => setField('validade_proposta', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Condição de pagamento</label>
                <input type="text" value={form.condicao_pagamento} onChange={e => setField('condicao_pagamento', e.target.value)} placeholder="Ex: À vista, 30/60 dias, cartão..." className="input" />
              </div>
            </div>
          </div>

          {/* Preços por item */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Preços por item</h2>
            {itens.length === 0 ? (
              <p className="text-sm text-lead-400">Nenhum item na solicitação.</p>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-1 text-xs font-semibold text-lead-500 uppercase tracking-wide">
                  <div className="col-span-5">Material</div>
                  <div className="col-span-2 text-center">Qtd</div>
                  <div className="col-span-2 text-right">Vl. Unit.</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
                {itens.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-lead-50 rounded-lg">
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-lead-900 truncate">{item.descricao}</p>
                      <p className="text-xs text-lead-500">{item.unidade}</p>
                    </div>
                    <div className="col-span-2 text-center text-sm text-lead-700 font-medium">{item.quantidade}</div>
                    <div className="col-span-2">
                      <input
                        type="number" step="0.01" min="0"
                        value={item.valor_unitario}
                        onChange={e => setItem(i, 'valor_unitario', e.target.value)}
                        placeholder="0,00"
                        className="input text-sm py-1.5 text-right"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number" step="0.01" min="0"
                        value={item.valor_total}
                        onChange={e => setItem(i, 'valor_total', e.target.value)}
                        placeholder="0,00"
                        className="input text-sm py-1.5 text-right font-semibold"
                      />
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="flex justify-end pt-2 border-t border-lead-200">
                  <div className="text-right">
                    <p className="text-xs text-lead-500">Total da proposta</p>
                    <p className="text-2xl font-bold text-lead-900">{fmt(valorTotal)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Obs */}
          <div className="card p-6">
            <label className="label">Observações da proposta</label>
            <textarea rows={3} value={form.observacoes} onChange={e => setField('observacoes', e.target.value)} placeholder="Informações adicionais do fornecedor..." className="input resize-none" />
          </div>

          <div className="flex justify-end gap-3">
            <Link href={`/dashboard/compras/${id}`} className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Salvar proposta</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
