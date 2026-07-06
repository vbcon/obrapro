import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { ShoppingCart, Plus, AlertTriangle, Clock, CheckCircle2, XCircle, Package, Pencil } from 'lucide-react'

const urgenciaConfig: Record<string, { label: string; color: string }> = {
  baixa:   { label: 'Baixa',   color: 'bg-lead-100 text-lead-600' },
  media:   { label: 'Média',   color: 'bg-blue-50 text-blue-700' },
  alta:    { label: 'Alta',    color: 'bg-yellow-50 text-yellow-700' },
  urgente: { label: 'Urgente', color: 'bg-red-50 text-red-700' },
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  aberta:      { label: 'Aberta',      color: 'bg-blue-50 text-blue-700',   icon: Clock },
  em_cotacao:  { label: 'Em cotação',  color: 'bg-yellow-50 text-yellow-700', icon: Package },
  aprovada:    { label: 'Aprovada',    color: 'bg-brand-50 text-brand-700', icon: CheckCircle2 },
  convertida:  { label: 'OC gerada',   color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  cancelada:   { label: 'Cancelada',   color: 'bg-red-50 text-red-700',     icon: XCircle },
}

export default async function ComprasPage() {
  const supabase = await createClient()

  const [{ data: solicitacoes }, { data: ordens }] = await Promise.all([
    supabase.from('solicitacoes_compra').select('*, obras(nome, codigo)').order('criado_em', { ascending: false }),
    supabase.from('compras').select('*, obras(nome), fornecedores(nome_fantasia, razao_social)').order('criado_em', { ascending: false }),
  ])

  const listaSolic = solicitacoes || []
  const listaOrdens = ordens || []

  return (
    <>
      <Header titulo="Compras" subtitulo="Solicitações e ordens de compra" />

      <div className="p-6 space-y-6">

        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Solicitações abertas', valor: listaSolic.filter((s: any) => s.status === 'aberta').length, cor: 'text-blue-600' },
            { label: 'Em cotação', valor: listaSolic.filter((s: any) => s.status === 'em_cotacao').length, cor: 'text-yellow-600' },
            { label: 'Aguardando aprovação', valor: listaSolic.filter((s: any) => s.status === 'aprovada').length, cor: 'text-brand-600' },
            { label: 'Ordens de compra', valor: listaOrdens.length, cor: 'text-green-600' },
          ].map(item => (
            <div key={item.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
              <p className="text-xs text-lead-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Solicitações */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-lead-100">
            <h2 className="font-semibold text-lead-900">Solicitações de Material</h2>
            <Link href="/dashboard/compras/nova" className="btn-primary">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Link>
          </div>

          {listaSolic.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="w-10 h-10 text-lead-300 mb-3" />
              <p className="font-medium text-lead-600">Nenhuma solicitação</p>
              <p className="text-sm text-lead-400 mt-1">Clique em "Nova Solicitação" para começar</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {listaSolic.map((s: any) => {
                const urgCfg = urgenciaConfig[s.urgencia] || urgenciaConfig.media
                const stsCfg = statusConfig[s.status] || statusConfig.aberta
                const StatusIcon = stsCfg.icon
                return (
                  <Link key={s.id} href={`/dashboard/compras/${s.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lead-900 truncate">{s.titulo}</p>
                      <p className="text-xs text-lead-500 mt-0.5">{s.obras?.codigo} — {s.obras?.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge ${urgCfg.color} hidden sm:inline-flex`}>
                        {s.urgencia === 'urgente' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {urgCfg.label}
                      </span>
                      <span className={`badge ${stsCfg.color} inline-flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{stsCfg.label}</span>
                      </span>
                      {s.data_necessidade && (
                        <span className="text-xs text-lead-400 hidden lg:block">
                          {new Date(s.data_necessidade).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      <Pencil className="w-3.5 h-3.5 text-lead-300" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Ordens de compra */}
        {listaOrdens.length > 0 && (
          <div className="card">
            <div className="px-6 py-4 border-b border-lead-100">
              <h2 className="font-semibold text-lead-900">Ordens de Compra</h2>
            </div>
            <div className="divide-y divide-lead-100">
              {listaOrdens.map((oc: any) => (
                <div key={oc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-lead-900 font-mono text-sm">{oc.numero_pedido || oc.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-lead-500">{oc.obras?.nome} · {oc.fornecedores?.nome_fantasia || oc.fornecedores?.razao_social || 'Fornecedor não informado'}</p>
                  </div>
                  <div className="text-sm font-semibold text-lead-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(oc.valor_total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
