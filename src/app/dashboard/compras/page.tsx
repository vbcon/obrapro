import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { ShoppingCart, Plus, AlertTriangle, Clock, CheckCircle2, XCircle, Package } from 'lucide-react'

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

export default async function ComprasPage() {
  const supabase = await createClient()

  const [{ data: solicitacoes }, { data: ordens }] = await Promise.all([
    supabase.from('solicitacoes_compra').select('*, obras(nome, codigo)').order('criado_em', { ascending: false }),
    supabase.from('compras').select('*, obras(nome), fornecedores(nome_fantasia, razao_social), tipo, fornecedor_nome').order('criado_em', { ascending: false }),
  ])

  const listaSolic  = solicitacoes || []
  const listaOrdens = ordens || []

  const kpis = [
    { label: 'Solicitações abertas',  valor: listaSolic.filter((s: any) => s.status === 'aberta').length,      cor: 'text-blue-600',  bg: 'bg-blue-50',    icon: Clock        },
    { label: 'Em cotação',            valor: listaSolic.filter((s: any) => s.status === 'em_cotacao').length,  cor: 'text-amber-600', bg: 'bg-amber-50',   icon: Package      },
    { label: 'Aguard. aprovação',     valor: listaSolic.filter((s: any) => s.status === 'aprovada').length,    cor: 'text-brand-600', bg: 'bg-brand-50',   icon: CheckCircle2 },
    { label: 'Ordens de compra',      valor: listaOrdens.length,                                               cor: 'text-emerald-600', bg: 'bg-emerald-50', icon: ShoppingCart },
  ]

  return (
    <>
      <Header titulo="Compras" subtitulo="Solicitações e ordens de compra" />

      <div className="page-body">

        {/* ── KPIs ── */}
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

        {/* ── Solicitações ── */}
        <div className="card animate-fade-up animation-delay-75">
          <div className="section-header">
            <span className="section-title">Solicitações de Material</span>
            <Link href="/dashboard/compras/nova" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Nova solicitação
            </Link>
          </div>

          {listaSolic.length === 0 ? (
            <div className="empty-state py-16">
              <div className="empty-state-icon">
                <ShoppingCart className="w-6 h-6 text-lead-400" />
              </div>
              <p className="text-sm font-medium text-lead-600">Nenhuma solicitação</p>
              <p className="text-xs text-lead-400 mt-1">Clique em "Nova Solicitação" para começar</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {listaSolic.map((s: any) => {
                const urg = URGENCIA[s.urgencia] || URGENCIA.media
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
                      {s.data_necessidade && (
                        <span className="text-xs text-lead-400 hidden lg:block">
                          {new Date(s.data_necessidade).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Ordens de compra ── */}
        <div className="card animate-fade-up animation-delay-150">
          <div className="section-header">
            <span className="section-title">Ordens de Compra</span>
            <Link href="/dashboard/compras/oc/nova" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Nova O.C. direta
            </Link>
          </div>
          {listaOrdens.length === 0 ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon">
                <Package className="w-6 h-6 text-lead-400" />
              </div>
              <p className="text-sm font-medium text-lead-600">Nenhuma ordem de compra</p>
              <p className="text-xs text-lead-400 mt-1">Gere uma O.C. via cotação aprovada ou diretamente aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {listaOrdens.map((oc: any) => (
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
                    </div>
                    <p className="text-xs text-lead-400 truncate">
                      {oc.obras?.nome} · {oc.fornecedor_nome || oc.fornecedores?.nome_fantasia || oc.fornecedores?.razao_social || '—'}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold text-lead-900 tabular-nums shrink-0">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(oc.valor_total)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
