import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { HardHat, Plus, MapPin, Calendar, TrendingUp } from 'lucide-react'

const STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  planejamento: { label: 'Planejamento',  dot: 'bg-blue-400',    badge: 'badge-blue' },
  em_andamento: { label: 'Em andamento',  dot: 'bg-emerald-500', badge: 'badge-green' },
  pausada:      { label: 'Pausada',       dot: 'bg-amber-400',   badge: 'badge-yellow' },
  concluida:    { label: 'Concluída',     dot: 'bg-lead-400',    badge: 'badge-neutral' },
  cancelada:    { label: 'Cancelada',     dot: 'bg-red-500',     badge: 'badge-red' },
}

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function diasRestantes(data?: string | null) {
  if (!data) return null
  const d = Math.ceil((new Date(data + 'T00:00:00').getTime() - Date.now()) / 86400000)
  if (d < 0)  return { texto: `${Math.abs(d)}d de atraso`, cor: 'text-red-600' }
  if (d === 0) return { texto: 'Vence hoje', cor: 'text-red-600' }
  if (d <= 14) return { texto: `${d}d restantes`, cor: 'text-amber-600' }
  return { texto: `${d}d restantes`, cor: 'text-lead-400' }
}

export default async function ObrasPage() {
  const supabase = await createClient()
  const { data: obras } = await supabase.from('obras').select('*').order('criado_em', { ascending: false })
  const lista = obras || []

  const emAndamento = lista.filter(o => o.status === 'em_andamento').length
  const concluidas  = lista.filter(o => o.status === 'concluida').length

  return (
    <>
      <Header titulo="Obras" subtitulo={`${lista.length} obra${lista.length !== 1 ? 's' : ''} cadastrada${lista.length !== 1 ? 's' : ''}`} />

      <div className="page-body">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-lead-500">
            {emAndamento > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {emAndamento} em andamento
              </span>
            )}
            {concluidas > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lead-300" />
                {concluidas} concluída{concluidas !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link href="/dashboard/obras/nova" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova obra
          </Link>
        </div>

        {/* ── Empty state ── */}
        {lista.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-24 text-center animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
              <HardHat className="w-7 h-7 text-brand-500" />
            </div>
            <h3 className="text-base font-semibold text-lead-900">Nenhuma obra cadastrada</h3>
            <p className="text-sm text-lead-400 mt-1 max-w-xs">
              Crie sua primeira obra para começar a gerenciar o projeto.
            </p>
            <Link href="/dashboard/obras/nova" className="btn-primary mt-6">
              <Plus className="w-4 h-4" />
              Cadastrar primeira obra
            </Link>
          </div>
        )}

        {/* ── Grid de obras ── */}
        {lista.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-up animation-delay-75">
            {lista.map((obra: any) => {
              const s    = STATUS[obra.status] || STATUS.planejamento
              const pct  = obra.percentual_conclusao || 0
              const dias = diasRestantes(obra.data_prevista)
              const barCor = obra.status === 'em_andamento'
                ? (dias && dias.cor === 'text-red-600' ? 'bg-red-500' : 'bg-emerald-500')
                : 'bg-lead-300'

              return (
                <Link
                  key={obra.id}
                  href={`/dashboard/obras/${obra.id}`}
                  className="card-hover flex flex-col overflow-hidden group"
                >
                  {/* Progress strip */}
                  <div className="h-0.5 bg-lead-100">
                    <div className={`h-full ${barCor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0
                                        group-hover:bg-brand-100 transition-colors">
                          <HardHat className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          {obra.codigo && (
                            <p className="text-[10px] font-mono font-medium text-lead-400 leading-none mb-0.5">
                              {obra.codigo}
                            </p>
                          )}
                          <h3 className="text-[13px] font-semibold text-lead-900 leading-tight line-clamp-2">
                            {obra.nome}
                          </h3>
                        </div>
                      </div>
                      <span className={`${s.badge} shrink-0 mt-0.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>

                    {/* Client */}
                    {obra.cliente && (
                      <p className="text-sm font-medium text-lead-700 -mt-1 truncate">{obra.cliente}</p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-lead-400">
                      {obra.cidade && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {obra.cidade}{obra.estado ? `, ${obra.estado}` : ''}
                        </span>
                      )}
                      {obra.data_prevista && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {new Date(obra.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5 mt-auto">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-lead-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Progresso
                        </span>
                        <div className="flex items-center gap-2">
                          {dias && <span className={`font-medium ${dias.cor}`}>{dias.texto}</span>}
                          <span className="font-bold text-lead-700 tabular-nums">{pct}%</span>
                        </div>
                      </div>
                      <div className="progress-track h-1.5">
                        <div className={`progress-fill h-full ${barCor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-lead-100 text-xs">
                      <span className="text-lead-500 font-medium">
                        {fmtMoeda(obra.orcamento_total || 0)}
                      </span>
                      <span className="text-brand-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalhes →
                      </span>
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
