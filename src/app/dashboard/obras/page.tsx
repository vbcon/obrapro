import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { HardHat, Plus, Search, MapPin, Calendar, TrendingUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import type { Obra } from '@/lib/types/database'

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  planejamento:  { label: 'Planejamento',  color: 'bg-blue-50 text-blue-700 ring-blue-600/20',    dot: 'bg-blue-500' },
  em_andamento:  { label: 'Em andamento',  color: 'bg-green-50 text-green-700 ring-green-600/20', dot: 'bg-green-500' },
  pausada:       { label: 'Pausada',       color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20', dot: 'bg-yellow-500' },
  concluida:     { label: 'Concluída',     color: 'bg-lead-100 text-lead-600 ring-lead-500/20',  dot: 'bg-lead-400' },
  cancelada:     { label: 'Cancelada',     color: 'bg-red-50 text-red-700 ring-red-600/20',      dot: 'bg-red-500' },
}

const tipoConfig: Record<string, string> = {
  residencial: 'Residencial',
  comercial:   'Comercial',
  industrial:  'Industrial',
  reforma:     'Reforma',
  outro:       'Outro',
}

export default async function ObrasPage() {
  const supabase = await createClient()
  const { data: obras } = await supabase
    .from('obras')
    .select('*')
    .order('criado_em', { ascending: false })

  const lista: Obra[] = obras || []

  return (
    <>
      <Header titulo="Obras" subtitulo={`${lista.length} obra${lista.length !== 1 ? 's' : ''} cadastrada${lista.length !== 1 ? 's' : ''}`} />

      <div className="p-6 space-y-5">

        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400" />
            <input type="search" placeholder="Buscar obra..." className="input pl-10 w-full" />
          </div>
          <button className="btn-primary shrink-0">
            <Plus className="w-4 h-4" />
            Nova Obra
          </button>
        </div>

        {/* Grid de obras */}
        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <HardHat className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-lead-900">Nenhuma obra cadastrada</h3>
            <p className="text-lead-500 text-sm mt-1 max-w-xs">
              Comece criando sua primeira obra para gerenciar projetos, cronogramas e compras.
            </p>
            <button className="btn-primary mt-6">
              <Plus className="w-4 h-4" />
              Cadastrar primeira obra
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lista.map(obra => {
              const cfg = statusConfig[obra.status] || statusConfig.planejamento
              return (
                <div key={obra.id} className="card hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer">

                  {/* Barra de progresso no topo */}
                  <div className="h-1 bg-lead-100">
                    <div
                      className="h-full bg-brand-500 transition-all"
                      style={{ width: `${obra.percentual_conclusao}%` }}
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                          <HardHat className="w-4.5 h-4.5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-mono text-lead-400">{obra.codigo}</p>
                          <h3 className="font-semibold text-lead-900 leading-tight line-clamp-1">{obra.nome}</h3>
                        </div>
                      </div>
                      <span className={`badge ring-1 ring-inset ${cfg.color} shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-sm text-lead-600 font-medium">{obra.cliente}</p>

                    {obra.cidade && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-lead-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {obra.cidade}{obra.estado ? `, ${obra.estado}` : ''}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-lead-100 space-y-2">
                      {/* Progresso */}
                      <div>
                        <div className="flex justify-between text-xs text-lead-500 mb-1">
                          <span>Progresso</span>
                          <span className="font-medium text-lead-700">{obra.percentual_conclusao}%</span>
                        </div>
                        <div className="w-full bg-lead-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-brand-500"
                            style={{ width: `${obra.percentual_conclusao}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-lead-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {obra.data_prevista
                            ? new Date(obra.data_prevista).toLocaleDateString('pt-BR')
                            : 'Sem prazo definido'}
                        </span>
                        <span className="font-medium text-lead-600">
                          {tipoConfig[obra.tipo] || obra.tipo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
