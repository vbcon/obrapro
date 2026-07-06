'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  ArrowLeft, Pencil, Plus, Copy, Check, MessageCircle,
  Building2, MapPin, Calendar, Package,
  CheckCircle2, XCircle, Clock, DollarSign, Send, ExternalLink
} from 'lucide-react'

const urgenciaLabels: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' }
const urgenciaCores: Record<string, string> = {
  baixa: 'bg-lead-100 text-lead-600',
  media: 'bg-blue-50 text-blue-700',
  alta: 'bg-yellow-50 text-yellow-700',
  urgente: 'bg-red-50 text-red-700',
}
const statusLabels: Record<string, string> = {
  aberta: 'Aberta', em_cotacao: 'Em cotação', aprovada: 'Aprovada internamente',
  aguardando_cliente: 'Aguardando cliente', convertida: 'OC Gerada', cancelada: 'Cancelada'
}
const statusCores: Record<string, string> = {
  aberta: 'bg-blue-50 text-blue-700',
  em_cotacao: 'bg-yellow-50 text-yellow-700',
  aprovada: 'bg-brand-50 text-brand-700',
  aguardando_cliente: 'bg-purple-50 text-purple-700',
  convertida: 'bg-green-50 text-green-700',
  cancelada: 'bg-red-50 text-red-700',
}
const cotStatusIcons: Record<string, React.ElementType> = {
  recebida: Clock, aprovada: CheckCircle2, rejeitada: XCircle,
  aguardando_cliente: Send, oc_gerada: CheckCircle2,
}
const cotStatusCores: Record<string, string> = {
  recebida: 'text-lead-500', aprovada: 'text-green-600', rejeitada: 'text-red-500',
  aguardando_cliente: 'text-purple-600', oc_gerada: 'text-green-700',
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function gerarTextoSolicitacao(sol: any, obra: any) {
  const dataEntrega = sol.data_necessidade
    ? new Date(sol.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR')
    : 'A definir'
  const endereco = [obra?.endereco, obra?.cidade, obra?.estado].filter(Boolean).join(', ') || 'Não informado'
  const itens = (sol.itens || [])
    .map((item: any, i: number) => `  ${i + 1}. ${item.descricao} — ${item.quantidade} ${item.unidade}${item.observacao ? ` (${item.observacao})` : ''}`)
    .join('\n')
  return `SOLICITAÇÃO DE MATERIAIS

Obra: ${obra?.nome || ''}${obra?.codigo ? ` (${obra.codigo})` : ''}
Endereço de entrega: ${endereco}
Data de entrega necessária: ${dataEntrega}
Urgência: ${urgenciaLabels[sol.urgencia] || sol.urgencia}

MATERIAIS SOLICITADOS:
${itens || '  (sem itens)'}
${sol.observacoes ? `\nObservações: ${sol.observacoes}` : ''}
---
Favor retornar com proposta de preços, prazo de entrega e condições de pagamento.`
}

export default function CompraDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [sol, setSol] = useState<any>(null)
  const [cotacoes, setCotacoes] = useState<any[]>([])
  const [ocGerada, setOcGerada] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  const [aprovando, setAprovando] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const supabase = createClient()
    const [{ data: solData }, { data: cotData }, { data: ocData }] = await Promise.all([
      supabase.from('solicitacoes_compra').select('*, obras(nome, codigo, endereco, cidade, estado)').eq('id', id).single(),
      supabase.from('cotacoes').select('*').eq('solicitacao_id', id).order('criado_em'),
      supabase.from('compras').select('*').eq('solicitacao_id', id).maybeSingle(),
    ])
    if (!solData) { router.push('/dashboard/compras'); return }
    setSol(solData)
    setCotacoes(cotData || [])
    setOcGerada(ocData)
    setCarregando(false)
  }, [id, router])

  useEffect(() => { carregar() }, [carregar])

  async function copiarTexto() {
    const texto = gerarTextoSolicitacao(sol, sol.obras)
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function abrirWhatsApp() {
    const texto = gerarTextoSolicitacao(sol, sol.obras)
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  async function enviarParaCliente(cot: any) {
    setEnviando(cot.id)
    const supabase = createClient()
    // Atualiza status para aguardando_cliente
    await Promise.all([
      supabase.from('cotacoes').update({ status: 'aguardando_cliente' }).eq('id', cot.id),
      supabase.from('solicitacoes_compra').update({ status: 'aguardando_cliente' }).eq('id', id),
    ])
    const link = `${window.location.origin}/aprovar/${cot.token_aprovacao}`
    const texto = `Olá! Segue o link para aprovação da proposta de materiais:\n\n*${sol.titulo}*\nFornecedor: ${cot.fornecedor_nome}\nValor total: ${fmt(cot.valor_total || 0)}\n\n${link}\n\nPara aprovar, basta acessar o link, conferir os dados e clicar em "Aprovar".`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    setLinkCopiado(link)
    await navigator.clipboard.writeText(link)
    await carregar()
    setEnviando(null)
  }

  async function aprovarCotacao(cotId: string) {
    setAprovando(cotId)
    const supabase = createClient()
    await Promise.all([
      supabase.from('cotacoes').update({ status: 'rejeitada' }).eq('solicitacao_id', id).neq('id', cotId),
      supabase.from('cotacoes').update({ status: 'aprovada' }).eq('id', cotId),
      supabase.from('solicitacoes_compra').update({ status: 'aprovada' }).eq('id', id),
    ])
    await carregar()
    setAprovando(null)
  }

  async function rejeitarCotacao(cotId: string) {
    await createClient().from('cotacoes').update({ status: 'rejeitada' }).eq('id', cotId)
    await carregar()
  }

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  const obra = sol.obras

  return (
    <>
      <Header titulo={sol.titulo} subtitulo={`${obra?.codigo ? obra.codigo + ' · ' : ''}${obra?.nome || ''}`} />

      <div className="p-6 max-w-4xl space-y-5">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/compras" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Link>
          <div className="flex items-center gap-2">
            <span className={`badge ${urgenciaCores[sol.urgencia]}`}>{urgenciaLabels[sol.urgencia]}</span>
            <span className={`badge ${statusCores[sol.status] || 'bg-lead-100 text-lead-600'}`}>{statusLabels[sol.status] || sol.status}</span>
            <Link href={`/dashboard/compras/${id}/editar`} className="btn-ghost py-1.5 px-3 text-sm">
              <Pencil className="w-3.5 h-3.5" />Editar
            </Link>
          </div>
        </div>

        {/* O.C. gerada — banner */}
        {ocGerada && (
          <div className="card p-5 border-2 border-green-300 bg-green-50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Ordem de Compra gerada!</p>
                  <p className="text-sm text-green-700">Número: <strong>{ocGerada.numero_pedido}</strong></p>
                </div>
              </div>
              <Link href={`/dashboard/compras/oc/${ocGerada.id}`} className="btn-secondary text-sm py-1.5 px-3 border-green-300 text-green-700 hover:bg-green-100">
                <ExternalLink className="w-3.5 h-3.5" />Ver O.C.
              </Link>
            </div>
          </div>
        )}

        {/* Resumo obra/entrega */}
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">Obra</p>
                <p className="font-semibold text-lead-900">{obra?.nome}</p>
                {obra?.codigo && <p className="text-xs text-lead-500">{obra.codigo}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">Endereço de entrega</p>
                <p className="font-semibold text-lead-900">{obra?.endereco || '—'}</p>
                {(obra?.cidade || obra?.estado) && (
                  <p className="text-xs text-lead-500">{[obra.cidade, obra.estado].filter(Boolean).join(' - ')}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">Data de entrega</p>
                <p className="font-semibold text-lead-900">
                  {sol.data_necessidade ? new Date(sol.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Itens */}
          <div className="card p-5">
            <h3 className="font-semibold text-lead-900 flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-brand-500" />Materiais solicitados
            </h3>
            {sol.itens?.length > 0 ? (
              <div className="space-y-1.5">
                {sol.itens.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-lead-50 rounded-lg">
                    <span className="text-xs font-bold text-lead-400 w-5 shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-lead-900">{item.descricao}</p>
                      {item.observacao && <p className="text-xs text-lead-500">{item.observacao}</p>}
                    </div>
                    <span className="text-sm font-semibold text-lead-700 shrink-0">{item.quantidade} {item.unidade}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-lead-400">Nenhum item cadastrado.</p>}
            {sol.observacoes && (
              <div className="mt-3 pt-3 border-t border-lead-100">
                <p className="text-xs text-lead-500 mb-1">Observações</p>
                <p className="text-sm text-lead-700">{sol.observacoes}</p>
              </div>
            )}
          </div>

          {/* Exportar para fornecedores */}
          <div className="card p-5 flex flex-col gap-4">
            <h3 className="font-semibold text-lead-900">Enviar para fornecedores</h3>
            <p className="text-sm text-lead-500">Compartilhe com seus fornecedores para receber propostas.</p>
            <div className="bg-lead-50 rounded-lg p-3 text-xs font-mono text-lead-700 whitespace-pre-wrap max-h-44 overflow-y-auto border border-lead-100">
              {gerarTextoSolicitacao(sol, obra)}
            </div>
            <div className="flex gap-2">
              <button onClick={copiarTexto} className="btn-secondary flex-1 justify-center">
                {copiado ? <><Check className="w-4 h-4 text-green-600" />Copiado!</> : <><Copy className="w-4 h-4" />Copiar texto</>}
              </button>
              <button onClick={abrirWhatsApp} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-green-500 hover:bg-green-600 text-white transition-colors">
                <MessageCircle className="w-4 h-4" />WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Link copiado aviso */}
        {linkCopiado && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
            <Check className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-purple-800">Link de aprovação enviado e copiado!</p>
              <p className="text-xs text-purple-600 mt-0.5 break-all">{linkCopiado}</p>
            </div>
          </div>
        )}

        {/* Cotações */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-lead-100">
            <div>
              <h3 className="font-semibold text-lead-900">Propostas recebidas</h3>
              <p className="text-xs text-lead-500 mt-0.5">{cotacoes.length} proposta{cotacoes.length !== 1 ? 's' : ''}</p>
            </div>
            {!ocGerada && (
              <Link href={`/dashboard/compras/${id}/cotacao/nova`} className="btn-primary">
                <Plus className="w-4 h-4" />Lançar proposta
              </Link>
            )}
          </div>

          {cotacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="w-8 h-8 text-lead-300 mb-2" />
              <p className="font-medium text-lead-600 text-sm">Nenhuma proposta ainda</p>
              <p className="text-xs text-lead-400 mt-1">Envie a solicitação aos fornecedores e lance as respostas aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {cotacoes.map(cot => {
                const Icon = cotStatusIcons[cot.status] || Clock
                const corStatus = cotStatusCores[cot.status] || 'text-lead-400'
                const isAprovada = cot.status === 'aprovada'
                const isAguardando = cot.status === 'aguardando_cliente'
                const isOcGerada = cot.status === 'oc_gerada'
                const isRejeitada = cot.status === 'rejeitada'
                const aprovacaoLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://app.vbcon.com.br'}/aprovar/${cot.token_aprovacao}`

                return (
                  <div key={cot.id} className={`p-5 transition-colors ${isAprovada || isAguardando ? 'bg-brand-50/40' : isOcGerada ? 'bg-green-50/60' : 'hover:bg-lead-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Icon className={`w-5 h-5 ${corStatus} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-lead-900">{cot.fornecedor_nome}</p>
                            {isAprovada && <span className="badge bg-brand-100 text-brand-700">✓ Aprovada internamente</span>}
                            {isAguardando && <span className="badge bg-purple-100 text-purple-700">⏳ Aguardando cliente</span>}
                            {isOcGerada && <span className="badge bg-green-100 text-green-700">✓ O.C. gerada</span>}
                            {isRejeitada && <span className="badge bg-red-100 text-red-600">✕ Rejeitada</span>}
                          </div>
                          {cot.fornecedor_contato && <p className="text-xs text-lead-500 mt-0.5">{cot.fornecedor_contato}</p>}
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-lead-600">
                            {cot.prazo_entrega && <span>📅 Entrega: {new Date(cot.prazo_entrega + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                            {cot.validade_proposta && <span>⏳ Válido até: {new Date(cot.validade_proposta + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                            {cot.condicao_pagamento && <span>💳 {cot.condicao_pagamento}</span>}
                          </div>
                          {isOcGerada && cot.aprovado_cliente_nome && (
                            <p className="text-xs text-green-700 mt-1">Aprovado por: <strong>{cot.aprovado_cliente_nome}</strong>{cot.aprovado_cliente_em ? ` em ${new Date(cot.aprovado_cliente_em).toLocaleDateString('pt-BR')}` : ''}</p>
                          )}
                          {/* Itens */}
                          {cot.itens?.length > 0 && (
                            <div className="mt-2 space-y-0.5">
                              {cot.itens.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs text-lead-700 bg-white/80 rounded px-2 py-1">
                                  <span className="truncate mr-2">{item.descricao} ({item.quantidade} {item.unidade})</span>
                                  <span className="font-semibold shrink-0">{fmt(item.valor_total || 0)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {cot.observacoes && <p className="text-xs text-lead-500 mt-1">{cot.observacoes}</p>}

                          {/* Link de aprovação quando aguardando cliente */}
                          {isAguardando && cot.token_aprovacao && (
                            <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                              <p className="text-xs text-purple-700 font-medium mb-1">Link de aprovação:</p>
                              <p className="text-xs text-purple-600 break-all">{aprovacaoLink}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coluna direita: valor + ações */}
                      <div className="text-right shrink-0 space-y-2">
                        <p className="text-xl font-bold text-lead-900">{fmt(cot.valor_total || 0)}</p>

                        {/* Aprovação interna */}
                        {cot.status === 'recebida' && !ocGerada && (
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => aprovarCotacao(cot.id)} disabled={aprovando === cot.id} className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 font-medium transition-colors disabled:opacity-60">
                              {aprovando === cot.id ? '...' : 'Aprovar'}
                            </button>
                            <button onClick={() => rejeitarCotacao(cot.id)} className="text-xs px-3 py-1.5 rounded-lg bg-lead-100 text-lead-600 hover:bg-lead-200 font-medium transition-colors">
                              Rejeitar
                            </button>
                          </div>
                        )}

                        {/* Enviar para cliente */}
                        {isAprovada && !ocGerada && (
                          <button onClick={() => enviarParaCliente(cot)} disabled={enviando === cot.id} className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5 ml-auto">
                            <Send className="w-3 h-3" />
                            {enviando === cot.id ? 'Enviando...' : 'Enviar para cliente'}
                          </button>
                        )}

                        {/* Reenviar link quando aguardando */}
                        {isAguardando && !ocGerada && cot.token_aprovacao && (
                          <button onClick={() => enviarParaCliente(cot)} disabled={enviando === cot.id} className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 font-medium transition-colors flex items-center gap-1.5 ml-auto">
                            <Send className="w-3 h-3" />Reenviar link
                          </button>
                        )}

                        {!isOcGerada && (
                          <Link href={`/dashboard/compras/${id}/cotacao/${cot.id}/editar`} className="inline-flex items-center gap-1 text-xs text-lead-400 hover:text-brand-600 transition-colors">
                            <Pencil className="w-3 h-3" />editar
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
