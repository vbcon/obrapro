import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { HardHat, Plus, MapPin, Calendar, DollarSign } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  planejamento:  { label: 'Planejamento',  color: 'bg-blue-50 text-blue-700 ring-blue-600/20',    dot: 'bg-blue-500' },
  em_andamento:  { label: 'Em andamento',  color: 'bg-green-50 text-green-700 ring-green-600/20', dot: 'bg-green-500' },
  pausada:       { label: 'Pausada',       color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20', dot: 'bg-yellow-500' },
  concluida:     { label: 'Concluída',     color: 'bg-lead-100 text-lead-600 ring-lead-500/20',   dot: 'bg-lead-400' },
  cancelada:     { label: 'Cancelada',     color: 'bg-red-50 text-red-700 ring-red-600/20',       dot: 'bg-red-500' },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default async function ObrasPage() {
  const supabase = await createClient()
  const { data: obras } = await supabase.from('obras').select('*').order('criado_em', { ascending: false })
  const lista = obras || []

  return (
    <>
      <Header titulo="Obras" subtitulo={`${lista.length} obra${lista.length !== 1 ? 's' : ''} cadastrada${lista.length !== 1 ? 's' : ''}`} />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Link href="/dashboard/obras/nova" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Obra
          </Link>
        </div>

        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <HardHat className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-lead-900">Nenhuma obra cadastrada</h3>
            <p className="text-lead-500 text-sm mt-1 max-w-xs">Comece cadastrando sua primeira obra.</p>
            <Link href="/dashboard/obras/nova" className="btn-primary mt-6">
              <Plus className="w-4 h-4" />
              Cadastrar primeira obra
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lista.map((obra: any) => {
              const cfg = statusConfig[obra.status] || statusConfig.planejamento
              return (
                <Link key={obra.id} href={`/dashboard/obras/${obra.id}`} className="card hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer block">
                  <div className="h-1 bg-lead-100">
                    <div className="h-full bg-brand-500" style={{ width: `${obra.percentual_conclusao}%` }} />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                          <HardHat className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-mono text-lead-400">{obra.codigo}</p>
                          <h3 className="font-semibold text-lead-900 leading-tight line-clamp-1">{obra.nome}</h3>
                        </div>
                      </div>
                      <span className={`badge ring-1 ring-inset ${cfg.color} shrink-0 text-xs`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-lead-700">{obra.cliente}</p>

                    {obra.cidade && (
                      <p className="flex items-center gap-1 mt-1 text-xs text-lead-400">
                        <MapPin className="w-3 h-3" />{obra.cidade}{obra.estado ? `, ${obra.estado}` : ''}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-lead-100 grid grid-cols-2 gap-2 text-xs text-lead-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-brand-400" />
                        {formatCurrency(obra.orcamento_total || 0)}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        {obra.data_prevista ? new Date(obra.data_prevista).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-lead-400 mb-1">
                        <span>Progresso</span>
                        <span className="font-medium">{obra.percentual_conclusao}%</span>
                      </div>
                      <div className="w-full bg-lead-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${obra.percentual_conclusao}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
