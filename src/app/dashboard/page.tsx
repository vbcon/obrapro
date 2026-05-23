import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import {
  HardHat,
  ShoppingCart,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'

async function getEstatisticas() {
  const supabase = await createClient()

  const [{ count: totalObras }, { count: obrasAtivas }, { count: totalCompras }, { data: obrasRecentes }] =
    await Promise.all([
      supabase.from('obras').select('*', { count: 'exact', head: true }),
      supabase.from('obras').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
      supabase.from('compras').select('*', { count: 'exact', head: true }),
      supabase.from('obras').select('id, nome, cliente, status, percentual_conclusao, data_prevista').order('criado_em', { ascending: false }).limit(5),
    ])

  return {
    totalObras: totalObras || 0,
    obrasAtivas: obrasAtivas || 0,
    totalCompras: totalCompras || 0,
    obrasRecentes: obrasRecentes || [],
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planejamento:  { label: 'Planejamento',  color: 'bg-blue-100 text-blue-700',   icon: Clock },
  em_andamento:  { label: 'Em andamento',  color: 'bg-green-100 text-green-700', icon: TrendingUp },
  pausada:       { label: 'Pausada',       color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  concluida:     { label: 'Concluída',     color: 'bg-lead-100 text-lead-600',   icon: CheckCircle2 },
  cancelada:     { label: 'Cancelada',     color: 'bg-red-100 text-red-700',     icon: AlertCircle },
}

export default async function DashboardPage() {
  const stats = await getEstatisticas()

  const cards = [
    {
      titulo: 'Total de Obras',
      valor: stats.totalObras,
      icone: HardHat,
      cor: 'bg-brand-500',
      sombra: 'shadow-brand-500/20',
      descricao: 'cadastradas no sistema',
    },
    {
      titulo: 'Obras Ativas',
      valor: stats.obrasAtivas,
      icone: TrendingUp,
      cor: 'bg-green-500',
      sombra: 'shadow-green-500/20',
      descricao: 'em andamento agora',
    },
    {
      titulo: 'Pedidos de Compra',
      valor: stats.totalCompras,
      icone: ShoppingCart,
      cor: 'bg-purple-500',
      sombra: 'shadow-purple-500/20',
      descricao: 'registrados',
    },
    {
      titulo: 'Eventos no Mês',
      valor: 0,
      icone: CalendarDays,
      cor: 'bg-blue-500',
      sombra: 'shadow-blue-500/20',
      descricao: 'no cronograma',
    },
  ]

  return (
    <>
      <Header titulo="Dashboard" subtitulo="Visão geral do sistema" />

      <div className="p-6 space-y-6">

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(card => {
            const Icon = card.icone
            return (
              <div key={card.titulo} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-lead-500 font-medium">{card.titulo}</p>
                    <p className="text-3xl font-bold text-lead-900 mt-1">{card.valor}</p>
                    <p className="text-xs text-lead-400 mt-1">{card.descricao}</p>
                  </div>
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${card.cor} shadow-lg ${card.sombra}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Obras recentes */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-lead-100">
            <h2 className="font-semibold text-lead-900">Obras Recentes</h2>
            <a href="/dashboard/obras" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {stats.obrasRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HardHat className="w-12 h-12 text-lead-300 mb-3" />
              <p className="font-medium text-lead-600">Nenhuma obra cadastrada</p>
              <p className="text-sm text-lead-400 mt-1">Comece adicionando sua primeira obra</p>
              <a href="/dashboard/obras" className="btn-primary mt-4">
                Cadastrar obra
              </a>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {stats.obrasRecentes.map((obra: { id: string; nome: string; cliente: string; status: string; percentual_conclusao: number; data_prevista?: string }) => {
                const cfg = statusConfig[obra.status] || statusConfig.planejamento
                const StatusIcon = cfg.icon
                return (
                  <div key={obra.id} className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50 transition-colors">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-500/10 shrink-0">
                      <HardHat className="w-4.5 h-4.5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lead-900 truncate">{obra.nome}</p>
                      <p className="text-xs text-lead-500 mt-0.5">{obra.cliente}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 bg-lead-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-brand-500"
                          style={{ width: `${obra.percentual_conclusao}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-lead-600 w-8">{obra.percentual_conclusao}%</span>
                    </div>
                    <span className={`badge ${cfg.color} hidden lg:inline-flex`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {cfg.label}
                    </span>
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
