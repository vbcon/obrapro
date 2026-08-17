'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ShoppingCart, Plus, AlertTriangle, Clock, CheckCircle2, XCircle, Package, Filter, X, DollarSign } from 'lucide-react'

const URGENCIA: Record<string, { label: string; badge: string }> = {
  baixa:   { label: 'Baixa',   badge: 'badge-neutral' },
  media:   { label: 'Média',   badge: 'badge-blue'    },
  alta:    { label: 'Alta',    badge: 'badge-yellow'  },
  urgente: { label: 'Urgente', badge: 'badge-red'     },
}

const STATUS_SOL: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  aberta:      { label: 'Aberta',      badge: 'badge-blue',    icon: Clock        },
  em_cotacao:  { label: 'Em cotação',  badge: 'badge-yellow',  icon: Package      },
  aprovada:    { label: 'Aprovada',    badge: 'badge-brand',   icon: CheckCircle2 },
  convertida:  { label: 'OC gerada',   badge: 'badge-green',   icon: CheckCircle2 },
  cancelada:   { label: 'Cancelada',   badge: 'badge-red',     icon: XCircle      },
}

const STATUS_OC: Record<string, { label: string; badge: string }> = {
  pendente:  { label: 'Pendente',  badge: 'badge-yellow'  },
  aprovado:  { label: 'Aprovado',  badge: 'badge-green'   },
  cancelado: { label: 'Cancelado', badge: 'badge-red'     },
  recebido:  { label: 'Recebido',  badge: 'badge-neutral' },
}

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default function ComprasPage() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [ordens, setOrdens]             = useState<any[]>([])
  const [obras, setObras]               = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [carregando, setCarregando]     = useState(true)

  const [filtroObraSol, setFiltroObraSol]     = useState('')
  const [filtroStatusSol, setFiltroStatusSol] = useState('')
  const [filtroObraOC, setFiltroObraOC]       = useState('')
  const [filtroStatusOC, setFiltroStatusOC]   = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('solicitacoes_compra').select('*, obras(id, nome, codigo)').order('criado_em', { ascending: false }),
      supabase.from('compras').select('*, obras(id, nome), fornecedores(nome_fantasia, razao_social), tipo, fornecedor_nome').order('criado_em', { ascending: false }),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ]).then(([{ data: s }, { data: o }, { data: ob }]) => {
      setSolicitacoes(s || [])
      setOrdens(o || [])
      setObras(ob || [])
      setCarregando(false)
    })
  }, [])

  const listaSolic = useMemo(() => solicitacoes.filter(s => {
    if (filtroObraSol   && s.obra_id !== filtroObraSol)   return false
    if (filtroStatusSol && s.status  !== filtroStatusSol) return false
    return true
  }), [solicitacoes, filtroObraSol, filtroStatusSol])

  const listaOrdens = useMemo(() => ordens.filter(o => {
    if (filtroObraOC   && o.obra_id !== filtroObraOC)   return false
    if (filtroStatusOC && o.status  !== filtroStatusOC) return false
    return true
  }), [ordens, filtroObraOC, filtroStatusOC])

  const totalOC = listaOrdens.reduce((s, o) => s + (o.valor_total || 0), 0)

  const kpis = [
    { label: 'Solicitações abertas', valor: solicitacoes.filter(s => s.status === 'aberta').length,      cor: 'text-blue-600',    bg: 'bg-blue-50',    icon: Clock        },
    { label: 'Em cotação',           valor: solicitacoes.filter(s => s.status === 'em_cotacao').length,  cor: 'text-amber-600',   bg: 'bg-amber-50',   icon: Package      },
    { label: 'Aguard. aprovação',    valor: solicitacoes.filter(s => s.status === 'aprovada').length,    cor: 'text-brand-600',   bg: 'bg-brand-50',   icon: CheckCircle2 },
    { label: 'Total em OCs',         valor: fmtMoeda(ordens.filter(o => o.status !== 'cancelado').reduce((s, o) => s + (o.valor_total || 0), 0)), cor: 'text-emerald-600', bg: 'bg-emerald-50', icon: DollarSign },
  ]

  return (
    <>
      <Header titulo="Compras" subtitulo="Solicitações e ordens de compra" />

      <div className="page-body">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map(k => {
            const Icon = k.icon
            return (
              <div key={k.label} className="card p-5">
                <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${k.cor}`} />
                </div>
                <p className={`text-2xl font-bold ${k.cor} tabular-nums leading-none`}>{k.valor}</p>
                <p className="text-xs text-lead-400 mt-1">{k.label}</p>
              </div>
            )
          })}
        </div>

        {/* Solicitações */}
        <div className="card animate-fade-up animation-delay-75">
          <div className="section-header">
            <span className="section-title">Solicitações de Material</span>
            <Link href="/dashboard/compras/nova" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />Nova solicitação
            </Link>
          </div>

          {/* Filtros solicitações */}
          <div className="px-5 pb-3 flex flex-wrap gap-2 border-b border-lead-100">
            <select value={filtroObraSol} onChange={e => setFiltroObraSol(e.target.value)} className="select select-sm max-w-[200px]">
              <option value="">Todas as obras</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
            </select>
            <select value={filtroStatusSol} onChange={e => setFiltroStatusSol(e.target.value)} className="select select-sm">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_SOL).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
            {(filtroObraSol || filtroStatusSol) && (
              <button onClick={() => { setFiltroObraSol(''); setFiltroStatusSol('') }}
                className="text-xs text-lead-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
            {(filtroObraSol || filtroStatusSol) && (
              <span className="text-xs text-lead-400 ml-auto self-center">{listaSolic.length} de {solicitacoes.length}</span>
            )}
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
          ) : listaSolic.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><ShoppingCart className="w-6 h-6 text-lead-400" /></div>
              <p className="text-sm font-medium text-lead-600">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {listaSolic.map((s: any) => {
                const urg = URGENCIA[s.urgencia]  || URGENCIA.media
                const sts = STATUS_SOL[s.status]  || STATUS_SOL.aberta
                const StatusIcon = sts.icon
                return (
                  <Link key={s.id} href={`/dashboard/compras/${s.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-lead-900 truncate">{s.titulo}</p>
                      <p className="text-xs text-lead-400 mt-0.5">{s.obras?.codigo} — {s.obras?.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`${urg.badge} hidden sm:inline-flex`}>
                        {s.urgencia === 'urgente' && <AlertTriangle className="w-3 h-3" />}
                        {urg.label}
                      </span>
                      <span className={`${sts.badge} inline-flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{sts.label}</span>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Ordens de compra */}
        <div className="card animate-fade-up animation-delay-150">
          <div className="section-header">
            <span className="section-title">Ordens de Compra</span>
            <Link href="/dashboard/compras/oc/nova" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />Nova O.C. direta
            </Link>
          </div>

          {/* Filtros OC */}
          <div className="px-5 pb-3 flex flex-wrap gap-2 border-b border-lead-100">
            <select value={filtroObraOC} onChange={e => setFiltroObraOC(e.target.value)} className="select select-sm max-w-[200px]">
              <option value="">Todas as obras</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
            </select>
            <select value={filtroStatusOC} onChange={e => setFiltroStatusOC(e.target.value)} className="select select-sm">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_OC).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
            {(filtroObraOC || filtroStatusOC) && (
              <button onClick={() => { setFiltroObraOC(''); setFiltroStatusOC('') }}
                className="text-xs text-lead-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
            {(filtroObraOC || filtroStatusOC) && (
              <span className="text-xs text-lead-400 ml-auto self-center">{listaOrdens.length} de {ordens.length}</span>
            )}
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
          ) : listaOrdens.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon"><Package className="w-6 h-6 text-lead-400" /></div>
              <p className="text-sm font-medium text-lead-600">Nenhuma ordem de compra encontrada</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-lead-100/80">
                {listaOrdens.map((oc: any) => {
                  const sts = STATUS_OC[oc.status] || STATUS_OC.pendente
                  return (
                    <Link key={oc.id} href={`/dashboard/compras/oc/${oc.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50/70 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-lead-900 font-mono">
                            {oc.numero_pedido || oc.id.slice(0, 8).toUpperCase()}
                          </p>
                          {oc.tipo === 'direta' && <span className="badge-purple text-[10px]">Direta</span>}
                          <span className={`${sts.badge} text-[10px]`}>{sts.label}</span>
                        </div>
                        <p className="text-xs text-lead-400 truncate">
                          {oc.obras?.nome} · {oc.fornecedor_nome || oc.fornecedores?.nome_fantasia || oc.fornecedores?.razao_social || '—'}
                        </p>
                      </div>
                      <span className="text-[13px] font-bold text-lead-900 tabular-nums shrink-0">
                        {fmtMoeda(oc.valor_total)}
                      </span>
                    </Link>
                  )
                })}
              </div>
              <div className="px-6 py-3 border-t border-lead-100 bg-lead-50/50 flex justify-end">
                <span className="text-xs font-semibold text-lead-700">
                  Total: {fmtMoeda(totalOC)}
                </span>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}
