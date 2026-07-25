'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle, Package, Building2, Loader2 } from 'lucide-react'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function AprovarOCPage() {
  const { token } = useParams<{ token: string }>()
  const supabase = createClient()

  const [oc, setOc] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [aprovando, setAprovando] = useState(false)
  const [aprovado, setAprovado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_oc_por_token', { p_token: token })
      if (error || !data) {
        setErro('Ordem de compra não encontrada ou link inválido.')
      } else {
        setOc(data)
        if (data.status === 'aprovado') setAprovado(true)
      }
      setCarregando(false)
    }
    load()
  }, [token])

  async function handleAprovar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Informe seu nome completo para aprovar.'); return }
    setErro('')
    setAprovando(true)
    const { data, error } = await supabase.rpc('aprovar_oc_por_token', {
      p_token: token,
      p_nome:  nome.trim(),
    })
    if (error || !data?.ok) {
      setErro(data?.erro || error?.message || 'Erro ao aprovar. Tente novamente.')
      setAprovando(false)
      return
    }
    setAprovado(true)
    setAprovando(false)
  }

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center bg-lead-50">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  )

  if (!oc && !aprovado) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lead-50 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <h1 className="text-xl font-bold text-lead-900 mb-2">Link inválido</h1>
      <p className="text-lead-500">{erro || 'Esta ordem de compra não foi encontrada.'}</p>
    </div>
  )

  if (aprovado) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-black text-lead-900 mb-2">Aprovado!</h1>
      <p className="text-lead-600 mb-1">
        A <strong>{oc?.numero_pedido}</strong> foi aprovada com sucesso.
      </p>
      {oc?.aprovado_cliente_nome && (
        <p className="text-sm text-lead-400">Por {oc.aprovado_cliente_nome}</p>
      )}
      <div className="mt-6 px-6 py-4 bg-white rounded-2xl border border-lead-100 shadow-sm">
        <p className="text-xs text-lead-400">Valor total aprovado</p>
        <p className="text-3xl font-black text-brand-600 mt-1">{fmt(oc?.valor_total || 0)}</p>
      </div>
      <p className="text-xs text-lead-400 mt-8">VBCON Engenharia · ObraPro</p>
    </div>
  )

  const obra = oc.obra
  const itens: any[] = Array.isArray(oc.itens) ? oc.itens : (oc.itens ? JSON.parse(oc.itens) : [])
  const jaAprovada = oc.status === 'aprovado'

  return (
    <div className="min-h-screen bg-lead-50">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }} className="px-5 pt-12 pb-8">
        <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest mb-1">VBCON Engenharia</p>
        <h1 className="text-2xl font-black text-white">{oc.numero_pedido}</h1>
        <p className="text-orange-100 mt-1">Ordem de Compra para aprovação</p>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">

        {/* Obra */}
        {obra && (
          <div className="bg-white rounded-2xl shadow-sm border border-lead-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="text-xs text-lead-400 mb-0.5">Obra</p>
                <p className="font-bold text-lead-900">{obra.nome}</p>
                {obra.cliente && <p className="text-sm text-lead-600">{obra.cliente}</p>}
                {obra.cidade && <p className="text-xs text-lead-400">{obra.cidade}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Valor + fornecedor */}
        <div className="bg-white rounded-2xl shadow-sm border border-lead-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-lead-400">Fornecedor</p>
              <p className="font-bold text-lead-900 mt-0.5">{oc.fornecedor_nome || '—'}</p>
              {oc.condicao_pagamento && (
                <p className="text-xs text-lead-500 mt-0.5">💳 {oc.condicao_pagamento}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-lead-400">Total</p>
              <p className="text-2xl font-black text-brand-600">{fmt(oc.valor_total || 0)}</p>
            </div>
          </div>
        </div>

        {/* Itens */}
        {itens.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-lead-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-lead-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-500" />
              <p className="font-semibold text-lead-900 text-sm">Itens</p>
            </div>
            <div className="divide-y divide-lead-50">
              {itens.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lead-900 truncate">{item.descricao}</p>
                    <p className="text-xs text-lead-400">
                      {item.quantidade} {item.unidade} × {fmt(item.valor_unitario || 0)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-lead-800 shrink-0">{fmt(item.valor_total || 0)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-lead-50 flex justify-between items-center border-t border-lead-100">
              <span className="text-sm font-semibold text-lead-700">Total</span>
              <span className="text-xl font-black text-brand-600">{fmt(oc.valor_total || 0)}</span>
            </div>
          </div>
        )}

        {oc.observacoes && (
          <div className="bg-white rounded-2xl shadow-sm border border-lead-100 p-5">
            <p className="text-xs text-lead-400 mb-1">Observações</p>
            <p className="text-sm text-lead-700">{oc.observacoes}</p>
          </div>
        )}

        {/* Formulário de aprovação */}
        {jaAprovada ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-800">Esta O.C. já foi aprovada</p>
            {oc.aprovado_cliente_nome && (
              <p className="text-sm text-green-600 mt-1">por {oc.aprovado_cliente_nome}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleAprovar} className="bg-white rounded-2xl shadow-sm border border-lead-100 p-5 space-y-4">
            <div>
              <p className="font-bold text-lead-900 text-lg">Aprovar Ordem de Compra</p>
              <p className="text-sm text-lead-500 mt-0.5">
                Ao aprovar, você confirma os itens e o valor acima.
              </p>
            </div>

            {erro && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm">{erro}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-lead-700 mb-1.5">
                Seu nome completo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full border border-lead-200 rounded-xl px-4 py-3 text-sm text-lead-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={aprovando || !nome.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-60"
              style={{ background: aprovando ? '#6b7280' : 'linear-gradient(135deg,#f97316,#ea580c)' }}
            >
              {aprovando
                ? <><Loader2 className="w-5 h-5 animate-spin" />Aprovando...</>
                : <><CheckCircle2 className="w-5 h-5" />Aprovar — {fmt(oc.valor_total || 0)}</>
              }
            </button>

            <p className="text-xs text-center text-lead-400">
              Sua aprovação é registrada com nome e data/hora.
            </p>
          </form>
        )}

        <p className="text-xs text-center text-lead-300 pb-4">VBCON Engenharia · ObraPro</p>
      </div>
    </div>
  )
}
