'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react'

interface Item { descricao: string; unidade: string; quantidade: string; valor_unitario: string }

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function EditarOCPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')
  const [oc, setOc]                 = useState<any>(null)

  const [form, setForm] = useState({
    data: '', fornecedor_nome: '', condicao_pagamento: '',
    telefone_cliente: '', observacoes: '',
    metodo_pagamento: '' as '' | 'pix' | 'ted' | 'boleto' | 'dinheiro',
    pix_tipo_chave: 'cnpj', pix_chave: '', pix_nome: '', pix_banco: '',
    ted_banco: '', ted_agencia: '', ted_conta: '', ted_tipo_conta: 'corrente', ted_cnpj_cpf: '', ted_nome: '',
  })
  const [itens, setItens] = useState<Item[]>([])

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('compras')
        .select('*, obras(nome, codigo)').eq('id', id).single()
      if (error || !data) { router.push('/dashboard/compras'); return }

      // OCs geradas de cotação podem guardar os itens na cotação
      let itensOrigem: any[] = Array.isArray(data.itens) ? data.itens : []
      if (itensOrigem.length === 0 && data.cotacao_id) {
        const { data: cot } = await supabase.from('cotacoes').select('itens').eq('id', data.cotacao_id).single()
        itensOrigem = Array.isArray(cot?.itens) ? cot!.itens : []
      }

      const dp = data.dados_pagamento || {}
      setOc(data)
      setForm({
        data:               data.data_pedido || '',
        fornecedor_nome:    data.fornecedor_nome || '',
        condicao_pagamento: data.condicao_pagamento || '',
        telefone_cliente:   data.telefone_cliente || '',
        observacoes:        data.observacoes || '',
        metodo_pagamento:   data.metodo_pagamento || '',
        pix_tipo_chave: dp.tipo_chave || 'cnpj', pix_chave: dp.chave || '',
        pix_nome: data.metodo_pagamento === 'pix' ? (dp.nome || '') : '',
        pix_banco: dp.banco && data.metodo_pagamento === 'pix' ? dp.banco : '',
        ted_banco: data.metodo_pagamento === 'ted' ? (dp.banco || '') : '',
        ted_agencia: dp.agencia || '', ted_conta: dp.conta || '',
        ted_tipo_conta: dp.tipo_conta || 'corrente', ted_cnpj_cpf: dp.cnpj_cpf || '',
        ted_nome: data.metodo_pagamento === 'ted' ? (dp.nome || '') : '',
      })
      setItens(itensOrigem.length > 0
        ? itensOrigem.map((i: any) => ({
            descricao: i.descricao || '', unidade: i.unidade || 'un',
            quantidade: String(i.quantidade ?? 1),
            valor_unitario: i.valor_unitario ? String(i.valor_unitario) : '',
          }))
        : [{ descricao: '', unidade: 'un', quantidade: '1', valor_unitario: '' }])
      setCarregando(false)
    })()
  }, [id, router])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }
  function setItem(i: number, f: keyof Item, v: string) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [f]: v } : item))
  }
  function addItem() { setItens(prev => [...prev, { descricao: '', unidade: 'un', quantidade: '1', valor_unitario: '' }]) }
  function removeItem(i: number) { setItens(prev => prev.filter((_, idx) => idx !== i)) }

  const total = itens.reduce((acc, it) =>
    acc + (parseFloat(it.quantidade) || 0) * (parseFloat(it.valor_unitario) || 0), 0)

  const jaAprovada = oc?.status === 'aprovado'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.fornecedor_nome.trim()) { setErro('Informe o fornecedor.'); return }
    const itensFilled = itens.filter(i => i.descricao && parseFloat(i.quantidade) > 0 && parseFloat(i.valor_unitario) > 0)
    if (itensFilled.length === 0) { setErro('Adicione pelo menos um item com valor.'); return }

    const itensPayload = itensFilled.map(i => ({
      descricao: i.descricao, unidade: i.unidade,
      quantidade: parseFloat(i.quantidade),
      valor_unitario: parseFloat(i.valor_unitario),
      valor_total: parseFloat(i.quantidade) * parseFloat(i.valor_unitario),
    }))

    let dados_pagamento: Record<string, string> | null = null
    if (form.metodo_pagamento === 'pix') {
      dados_pagamento = { tipo_chave: form.pix_tipo_chave, chave: form.pix_chave, nome: form.pix_nome, banco: form.pix_banco }
    } else if (form.metodo_pagamento === 'ted') {
      dados_pagamento = {
        banco: form.ted_banco, agencia: form.ted_agencia, conta: form.ted_conta,
        tipo_conta: form.ted_tipo_conta, cnpj_cpf: form.ted_cnpj_cpf, nome: form.ted_nome,
      }
    }

    // Se já estava aprovada e os itens/valor mudaram, o cliente precisa aprovar de novo
    const itensAntes = JSON.stringify((Array.isArray(oc.itens) ? oc.itens : []).map((i: any) => [i.descricao, Number(i.quantidade), Number(i.valor_unitario)]))
    const itensDepois = JSON.stringify(itensPayload.map(i => [i.descricao, i.quantidade, i.valor_unitario]))
    const valorMudou = jaAprovada && (itensAntes !== itensDepois || Math.abs(total - Number(oc.valor_total || 0)) > 0.005)

    setSalvando(true)
    const supabase = createClient()
    const { error } = await supabase.from('compras').update({
      data_pedido:        form.data || oc.data_pedido,
      fornecedor_nome:    form.fornecedor_nome.trim(),
      condicao_pagamento: form.condicao_pagamento || null,
      telefone_cliente:   form.telefone_cliente || null,
      observacoes:        form.observacoes || null,
      valor_total:        total,
      itens:              itensPayload,
      metodo_pagamento:   form.metodo_pagamento || null,
      dados_pagamento,
      ...(valorMudou ? {
        status: 'aguardando_aprovacao',
        aprovado_cliente_em: null,
        aprovado_cliente_nome: null,
      } : {}),
    }).eq('id', id)

    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
    router.push(`/dashboard/compras/oc/${id}`)
    router.refresh()
  }

  if (carregando) {
    return (
      <>
        <Header titulo="Editar O.C." subtitulo="Carregando..." />
        <div className="page-body flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header titulo={`Editar O.C. ${oc.numero_pedido}`}
        subtitulo={oc.obras ? `${oc.obras.codigo} — ${oc.obras.nome}` : 'Ordem de Compra'} />

      <div className="page-body max-w-3xl">
        <Link href={`/dashboard/compras/oc/${id}`}
          className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {jaAprovada && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-amber-800 text-sm">
              Esta O.C. já foi <strong>aprovada pelo cliente</strong>. Se você alterar os itens ou o valor,
              a aprovação será reiniciada e o cliente precisará aprovar novamente.
            </p>
          </div>
        )}

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Data</label>
                <input type="date" value={form.data} onChange={e => set('data', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Número</label>
                <input type="text" value={oc.numero_pedido} disabled className="input opacity-60" />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Fornecedor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome do fornecedor *</label>
                <input type="text" required value={form.fornecedor_nome}
                  onChange={e => set('fornecedor_nome', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Condição de pagamento</label>
                <input type="text" value={form.condicao_pagamento}
                  onChange={e => set('condicao_pagamento', e.target.value)}
                  placeholder="Ex: À vista, 30/60 dias..." className="input" />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Aprovação do cliente</h2>
            <div>
              <label className="label">WhatsApp do cliente <span className="label-hint">com DDD, sem espaços</span></label>
              <input type="text" value={form.telefone_cliente}
                onChange={e => set('telefone_cliente', e.target.value.replace(/\D/g, ''))}
                placeholder="61999998888" className="input" maxLength={13} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lead-900">Itens</h2>
              <button type="button" onClick={addItem} className="btn-ghost text-sm py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />Adicionar item
              </button>
            </div>
            <div className="space-y-3">
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-semibold text-lead-500 uppercase px-1">
                <span className="col-span-5">Descrição</span>
                <span className="col-span-2">Unidade</span>
                <span className="col-span-2 text-right">Qtd</span>
                <span className="col-span-2 text-right">Valor unit.</span>
                <span className="col-span-1"></span>
              </div>
              {itens.map((item, i) => {
                const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0)
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" value={item.descricao} onChange={e => setItem(i, 'descricao', e.target.value)}
                      placeholder="Material / serviço" className="input col-span-12 sm:col-span-5 text-sm" />
                    <input type="text" value={item.unidade} onChange={e => setItem(i, 'unidade', e.target.value)}
                      className="input col-span-3 sm:col-span-2 text-sm text-center" />
                    <input type="number" min="0" step="0.01" value={item.quantidade}
                      onChange={e => setItem(i, 'quantidade', e.target.value)}
                      className="input col-span-3 sm:col-span-2 text-sm text-right" />
                    <input type="number" min="0" step="0.01" value={item.valor_unitario}
                      onChange={e => setItem(i, 'valor_unitario', e.target.value)}
                      placeholder="0,00" className="input col-span-5 sm:col-span-2 text-sm text-right" />
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {subtotal > 0 && <span className="text-xs text-lead-500 hidden sm:block">{fmt(subtotal)}</span>}
                      <button type="button" onClick={() => removeItem(i)} disabled={itens.length === 1}
                        className="p-1.5 text-lead-300 hover:text-red-500 disabled:opacity-30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-lead-100 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-lead-500">Total geral</p>
                <p className="text-2xl font-bold text-brand-600">{fmt(total)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados para pagamento</h2>
            <div>
              <label className="label">Forma de pagamento</label>
              <select value={form.metodo_pagamento} onChange={e => set('metodo_pagamento', e.target.value)} className="select">
                <option value="">Não informar</option>
                <option value="pix">PIX</option>
                <option value="ted">Transferência (TED)</option>
                <option value="boleto">Boleto</option>
                <option value="dinheiro">Dinheiro / Espécie</option>
              </select>
            </div>

            {form.metodo_pagamento === 'pix' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-lead-100">
                <div>
                  <label className="label">Tipo de chave PIX</label>
                  <select value={form.pix_tipo_chave} onChange={e => set('pix_tipo_chave', e.target.value)} className="select">
                    <option value="cnpj">CNPJ</option><option value="cpf">CPF</option>
                    <option value="email">E-mail</option><option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave aleatória</option>
                  </select>
                </div>
                <div>
                  <label className="label">Chave PIX *</label>
                  <input type="text" required value={form.pix_chave} onChange={e => set('pix_chave', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Nome do favorecido</label>
                  <input type="text" value={form.pix_nome} onChange={e => set('pix_nome', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Banco</label>
                  <input type="text" value={form.pix_banco} onChange={e => set('pix_banco', e.target.value)} className="input" />
                </div>
              </div>
            )}

            {form.metodo_pagamento === 'ted' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-lead-100">
                <div>
                  <label className="label">Banco *</label>
                  <input type="text" required value={form.ted_banco} onChange={e => set('ted_banco', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Agência</label>
                  <input type="text" value={form.ted_agencia} onChange={e => set('ted_agencia', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Conta</label>
                  <input type="text" value={form.ted_conta} onChange={e => set('ted_conta', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Tipo de conta</label>
                  <select value={form.ted_tipo_conta} onChange={e => set('ted_tipo_conta', e.target.value)} className="select">
                    <option value="corrente">Corrente</option><option value="poupanca">Poupança</option>
                  </select>
                </div>
                <div>
                  <label className="label">CNPJ / CPF</label>
                  <input type="text" value={form.ted_cnpj_cpf} onChange={e => set('ted_cnpj_cpf', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Nome do favorecido</label>
                  <input type="text" value={form.ted_nome} onChange={e => set('ted_nome', e.target.value)} className="input" />
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-3">Observações</h2>
            <textarea rows={3} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} className="textarea" />
          </div>

          <div className="flex gap-3 justify-end">
            <Link href={`/dashboard/compras/oc/${id}`} className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Salvar alterações</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
