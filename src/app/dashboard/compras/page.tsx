import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { ShoppingCart, Plus, Search, Package, CheckCircle2, Clock, Truck, XCircle, FileEdit } from 'lucide-react'
import type { Compra } from '@/lib/types/database'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: 'Rascunho',  color: 'bg-lead-100 text-lead-600',     icon: FileEdit },
  enviado:  { label: 'Enviado',   color: 'bg-blue-50 text-blue-700',      icon: Clock },
  aprovado: { label: 'Aprovado',  color: 'bg-brand-50 text-brand-700',    icon: CheckCircle2 },
  recebido: { label: 'Recebido',  color: 'bg-green-50 text-green-700',    icon: Truck },
  cancelado:{ label: 'Cancelado', color: 'bg-red-50 text-red-700',        icon: XCircle },
}

function formatCurrency(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export default async function ComprasPage() {
  const supabase = await createClient()
  const { data: compras } = await supabase
    .from('compras')
    .select('*, obras(nome), fornecedores(razao_social, nome_fantasia)')
    .order('criado_em', { ascending: false })

  const lista: Compra[] = compras || []

  const totalPendente = lista.filter(c => ['enviado', 'aprovado'].includes(c.status)).reduce((acc, c) => acc + c.valor_total, 0)
  const totalRecebido = lista.filter(c => c.status === 'recebido').reduce((acc, c) => acc + c.valor_total, 0)

  return (
    <>
      <Header titulo="Compras" subtitulo={`${lista.length} pedido${lista.length !== 1 ? 's' : ''} de compra`} />

      <div className="p-6 space-y-5">

        {/* Resumo financeiro */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-sm text-lead-500">Total de pedidos</p>
            <p className="text-2xl font-bold text-lead-900 mt-1">{lista.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-lead-500">Em aberto / aprovado</p>
            <p className="text-2xl font-bold text-brand-600 mt-1">{formatCurrency(totalPendente)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-lead-500">Total recebido</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalRecebido)}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400" />
            <input type="search" placeholder="Buscar pedido..." className="input pl-10 w-full" />
          </div>
          <button className="btn-primary shrink-0">
            <Plus className="w-4 h-4" />
            Novo pedido
          </button>
        </div>

        {/* Tabela */}
        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-lead-900">Nenhum pedido de compra</h3>
            <p className="text-lead-500 text-sm mt-1 max-w-xs">
              Registre pedidos de materiais e serviços para cada obra.
            </p>
            <button className="btn-primary mt-6">
              <Plus className="w-4 h-4" />
              Criar primeiro pedido
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-lead-50 border-b border-lead-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-lead-500 uppercase tracking-wide">Pedido</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-lead-500 uppercase tracking-wide">Obra</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-lead-500 uppercase tracking-wide hidden md:table-cell">Fornecedor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-lead-500 uppercase tracking-wide hidden lg:table-cell">Data</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-lead-500 uppercase tracking-wide">Valor</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-lead-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lead-100">
                  {lista.map((compra: Compra & { obras?: { nome: string }; fornecedores?: { razao_social: string; nome_fantasia?: string } }) => {
                    const cfg = statusConfig[compra.status] || statusConfig.rascunho
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={compra.id} className="hover:bg-lead-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-brand-500/10 flex items-center justify-center shrink-0">
                              <Package className="w-3.5 h-3.5 text-brand-600" />
                            </div>
                            <span className="font-medium text-lead-900 font-mono text-xs">
                              {compra.numero_pedido || compra.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-lead-700">{compra.obras?.nome || '—'}</td>
                        <td className="px-4 py-3 text-lead-500 hidden md:table-cell">
                          {compra.fornecedores?.nome_fantasia || compra.fornecedores?.razao_social || '—'}
                        </td>
                        <td className="px-4 py-3 text-lead-500 hidden lg:table-cell">
                          {new Date(compra.data_pedido).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-lead-900">
                          {formatCurrency(compra.valor_total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`badge ${cfg.color} inline-flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
