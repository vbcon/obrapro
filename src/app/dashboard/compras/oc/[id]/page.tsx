'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Building2, MapPin, Calendar, Package, DollarSign, CheckCircle2, Copy, Check, Printer } from 'lucide-react'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function OcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [oc, setOc] = useState<any>(null)
  const [cotacao, setCotacao] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('compras')
      .select('*, obras(nome, codigo, endereco, cidade, estado, cliente), solicitacoes_compra(titulo, itens, data_necessidade)')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (!data) return
        setOc(data)
        if (data.cotacao_id) {
          const { data: cotData } = await supabase.from('cotacoes').select('*').eq('id', data.cotacao_id).single()
          setCotacao(cotData)
        }
        setCarregando(false)
      })
  }, [id])

  async function copiarNumero() {
    await navigator.clipboard.writeText(oc.numero_pedido)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!oc) return null

  const obra = oc.obras
  const sol = oc.solicitacoes_compra
  const itens = cotacao?.itens || oc.itens || sol?.itens || []
  const condicaoPagamento = oc.condicao_pagamento || cotacao?.condicao_pagamento

  return (
    <>
      <Header titulo={`O.C. ${oc.numero_pedido}`} subtitulo="Ordem de Compra" />

      <div className="p-6 max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/compras" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Link>
          <div className="flex items-center gap-2">
            <span className="badge bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3" />Aprovada
            </span>
            <button onClick={() => window.print()} className="btn-ghost py-1.5 px-3 text-sm">
              <Printer className="w-3.5 h-3.5" />Imprimir
            </button>
          </div>
        </div>

        {/* Header da OC */}
        <div className="card p-6 border-2 border-lead-200">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-lead-500 uppercase tracking-widest mb-1">Ordem de Compra</p>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-lead-900">{oc.numero_pedido}</h1>
                <button onClick={copiarNumero} className="p-1.5 text-lead-400 hover:text-brand-600 transition-colors rounded">
                  {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-lead-500 mt-1">
                Emitida em: {new Date(oc.data_pedido + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-lead-500 mb-1">Valor total</p>
              <p className="text-3xl font-black text-brand-600">{fmt(oc.valor_total || 0)}</p>
              {condicaoPagamento && (
                <p className="text-xs text-lead-500 mt-1">💳 {condicaoPagamento}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fornecedor + Obra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card p-5 space-y-1">
            <p className="text-xs text-lead-500 uppercase tracking-wide font-semibold mb-2">Fornecedor</p>
            <p className="text-lg font-bold text-lead-900">{oc.fornecedor_nome}</p>
            {cotacao?.fornecedor_contato && <p className="text-sm text-lead-600">{cotacao.fornecedor_contato}</p>}
            {cotacao?.aprovado_cliente_nome && (
              <div className="pt-2 border-t border-lead-100 mt-2">
                <p className="text-xs text-lead-500">Aprovado por</p>
                <p className="text-sm font-semibold text-green-700">{cotacao.aprovado_cliente_nome}</p>
                {cotacao.aprovado_cliente_em && (
                  <p className="text-xs text-lead-400">{new Date(cotacao.aprovado_cliente_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <p className="text-xs text-lead-500 uppercase tracking-wide font-semibold mb-2">Obra / Entrega</p>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-lead-900">{obra?.nome}</p>
                {obra?.codigo && <p className="text-xs text-lead-500">{obra.codigo}</p>}
              </div>
            </div>
            {(obra?.endereco || obra?.cidade) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-lead-700">{obra.endereco}</p>
                  {(obra.cidade || obra.estado) && <p className="text-xs text-lead-500">{[obra.cidade, obra.estado].filter(Boolean).join(' - ')}</p>}
                </div>
              </div>
            )}
            {oc.data_entrega_prevista && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                <p className="text-sm text-lead-700">Entrega: <strong>{new Date(oc.data_entrega_prevista + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></p>
              </div>
            )}
          </div>
        </div>

        {/* Referência */}
        {sol?.titulo && (
          <div className="card p-4 bg-lead-50">
            <p className="text-xs text-lead-500 mb-0.5">Referência</p>
            <p className="text-sm font-medium text-lead-800">{sol.titulo}</p>
          </div>
        )}

        {/* Itens */}
        <div className="card p-5">
          <h3 className="font-semibold text-lead-900 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-brand-500" />Itens da Ordem de Compra
          </h3>
          {itens.length > 0 ? (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-semibold text-lead-500 uppercase tracking-wide">
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-2 text-right">Vl. Unit.</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              {itens.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-2 py-2.5 rounded-lg hover:bg-lead-50 text-sm">
                  <div className="col-span-5">
                    <p className="font-medium text-lead-900">{item.descricao}</p>
                    <p className="text-xs text-lead-500">{item.unidade}</p>
                  </div>
                  <div className="col-span-2 text-center text-lead-700">{item.quantidade}</div>
                  <div className="col-span-2 text-right text-lead-700">
                    {item.valor_unitario > 0 ? fmt(item.valor_unitario) : '—'}
                  </div>
                  <div className="col-span-3 text-right font-semibold text-lead-900">
                    {item.valor_total > 0 ? fmt(item.valor_total) : '—'}
                  </div>
                </div>
              ))}
              {/* Totais */}
              <div className="flex justify-end pt-3 border-t border-lead-200">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-semibold text-lead-700">Total:</span>
                  </div>
                  <span className="text-2xl font-black text-brand-600">{fmt(oc.valor_total || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-lead-400">Itens não disponíveis.</p>
          )}
        </div>

        {oc.observacoes && (
          <div className="card p-5">
            <p className="text-xs text-lead-500 mb-1">Observações</p>
            <p className="text-sm text-lead-700">{oc.observacoes}</p>
          </div>
        )}

        {sol && (
          <Link href={`/dashboard/compras/${oc.solicitacao_id}`} className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700">
            <ArrowLeft className="w-4 h-4" />Ver solicitação original
          </Link>
        )}
      </div>
    </>
  )
}
