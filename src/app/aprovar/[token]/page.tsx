'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Building2, MapPin, Calendar, Package, DollarSign, AlertCircle, Clock } from 'lucide-react'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

type Estado = 'loading' | 'ready' | 'not_found' | 'already_done' | 'approved' | 'error'

export default function AprovacaoClientePage() {
  const { token } = useParams<{ token: string }>()
  const [estado, setEstado] = useState<Estado>('loading')
  const [dados, setDados] = useState<any>(null)
  const [nome, setNome] = useState('')
  const [aprovando, setAprovando] = useState(false)
  const [oc, setOc] = useState<{ numero: string; id: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('get_cotacao_por_token', { p_token: token }).then(({ data, error }) => {
      if (error || !data) { setEstado('error'); return }
      if (data.error === 'not_found') { setEstado('not_found'); return }
      if (data.status === 'oc_gerada') { setEstado('already_done'); return }
      setDados(data)
      setEstado('ready')
    })
  }, [token])

  async function handleAprovar() {
    if (!nome.trim()) return
    setAprovando(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('aprovar_cotacao_cliente', {
      p_token: token,
      p_nome: nome.trim(),
    })
    if (error || data?.error) {
      if (data?.error === 'already_done') { setEstado('already_done'); return }
      setEstado('error'); setAprovando(false); return
    }
    setOc({ numero: data.oc_numero, id: data.oc_id })
    setEstado('approved')
  }

  // ── Telas de estado ──────────────────────────────────────────────

  if (estado === 'loading') return (
    <div className="min-h-screen bg-lead-50 flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  if (estado === 'not_found') return (
    <Wrapper>
      <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-lead-900 text-center mb-2">Proposta não encontrada</h1>
      <p className="text-center text-lead-500 text-sm">Este link é inválido ou já expirou.</p>
    </Wrapper>
  )

  if (estado === 'already_done') return (
    <Wrapper>
      <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-lead-900 text-center mb-2">Proposta já aprovada</h1>
      <p className="text-center text-lead-500 text-sm">Esta proposta já foi aprovada anteriormente. A Ordem de Compra foi gerada.</p>
    </Wrapper>
  )

  if (estado === 'approved' && oc) return (
    <Wrapper>
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-green-700 text-center mb-2">Proposta aprovada!</h1>
      <p className="text-center text-lead-500 mb-5">Obrigado, <strong>{nome}</strong>. A Ordem de Compra foi gerada.</p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-xs text-green-600 uppercase tracking-widest font-semibold mb-1">Número da O.C.</p>
        <p className="text-3xl font-black text-green-700">{oc.numero}</p>
      </div>
      <p className="text-center text-xs text-lead-400 mt-5">Guarde este número para acompanhamento.</p>
    </Wrapper>
  )

  if (estado === 'error') return (
    <Wrapper>
      <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-lead-900 text-center mb-2">Erro ao processar</h1>
      <p className="text-center text-lead-500 text-sm">Tente novamente ou entre em contato.</p>
    </Wrapper>
  )

  if (!dados) return null

  const obra = dados.obra
  const sol = dados.solicitacao
  const dataEntrega = dados.prazo_entrega
    ? new Date(dados.prazo_entrega + 'T00:00:00').toLocaleDateString('pt-BR')
    : 'A confirmar'
  const dataNecessidade = sol.data_necessidade
    ? new Date(sol.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR')
    : null

  const isAguardando = dados.status === 'aguardando_cliente'

  // ── Página principal ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-lead-50">
      {/* Header */}
      <div className="bg-white border-b border-lead-100">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">OP</span>
            </div>
            <span className="font-bold text-lead-900">OBRAPRO</span>
          </div>
          {isAguardando && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
              <Clock className="w-3 h-3" />
              Aguardando aprovação
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">

        {/* Título */}
        <div>
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-1">Proposta para aprovação</p>
          <h1 className="text-2xl font-black text-lead-900">{sol.titulo}</h1>
        </div>

        {/* Obra / Entrega */}
        <div className="bg-white rounded-2xl border border-lead-100 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-lead-500">Obra</p>
              <p className="font-semibold text-lead-900">{obra.nome}{obra.codigo ? ` (${obra.codigo})` : ''}</p>
            </div>
          </div>
          {(obra.endereco || obra.cidade) && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">Endereço de entrega</p>
                <p className="font-semibold text-lead-900">{obra.endereco || ''}</p>
                {(obra.cidade || obra.estado) && <p className="text-sm text-lead-500">{[obra.cidade, obra.estado].filter(Boolean).join(' - ')}</p>}
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-lead-500">Data de entrega solicitada</p>
              <p className="font-semibold text-lead-900">{dataNecessidade || 'A definir'}</p>
              {dados.prazo_entrega && (
                <p className="text-xs text-lead-500">Confirmado pelo fornecedor: {dataEntrega}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fornecedor */}
        <div className="bg-white rounded-2xl border border-lead-100 p-5">
          <p className="text-xs text-lead-500 mb-1">Fornecedor selecionado</p>
          <p className="text-lg font-bold text-lead-900">{dados.fornecedor_nome}</p>
          {dados.condicao_pagamento && <p className="text-sm text-lead-500 mt-0.5">Pagamento: {dados.condicao_pagamento}</p>}
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-lead-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-brand-500" />
            <h2 className="font-semibold text-lead-900">Materiais</h2>
          </div>
          <div className="space-y-2">
            {(dados.itens || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-lead-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-lead-900">{item.descricao}</p>
                  <p className="text-xs text-lead-500">{item.quantidade} {item.unidade}</p>
                </div>
                {item.valor_total > 0 && (
                  <p className="text-sm font-semibold text-lead-900 ml-3">{fmt(item.valor_total)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-brand-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 opacity-80" />
            <span className="font-semibold">Valor total da proposta</span>
          </div>
          <span className="text-2xl font-black">{fmt(dados.valor_total || 0)}</span>
        </div>

        {dados.observacoes && (
          <div className="bg-white rounded-2xl border border-lead-100 p-5">
            <p className="text-xs text-lead-500 mb-1">Observações do fornecedor</p>
            <p className="text-sm text-lead-700">{dados.observacoes}</p>
          </div>
        )}

        {/* Aprovação */}
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-lead-900">Confirmar aprovação</h2>
          <p className="text-sm text-lead-500">
            Ao aprovar, você autoriza a emissão da Ordem de Compra para o fornecedor acima com as condições descritas.
          </p>
          <div>
            <label className="block text-sm font-medium text-lead-700 mb-1.5">Seu nome completo *</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Carlos Oliveira"
              className="w-full px-4 py-3 rounded-xl border border-lead-200 focus:outline-none focus:ring-2 focus:ring-brand-400 text-lead-900 text-sm"
            />
          </div>
          <button
            onClick={handleAprovar}
            disabled={!nome.trim() || aprovando}
            className="w-full py-4 rounded-xl bg-brand-500 text-white font-bold text-base transition-all hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {aprovando ? (
              <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Processando...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" />Aprovar proposta e gerar O.C.</>
            )}
          </button>
          <p className="text-center text-xs text-lead-400">
            Dúvidas? Entre em contato antes de aprovar.
          </p>
        </div>

        <p className="text-center text-xs text-lead-300 pb-4">Powered by OBRAPRO</p>
      </div>
    </div>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lead-50 flex items-center justify-center px-5">
      <div className="bg-white rounded-2xl border border-lead-100 p-8 max-w-sm w-full">
        {children}
      </div>
    </div>
  )
}
