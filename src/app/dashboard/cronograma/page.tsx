import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { CalendarDays, Plus, Flag, Truck, Users, Eye, CreditCard, HelpCircle, CheckCircle2 } from 'lucide-react'
import type { EventoCronograma } from '@/lib/types/database'

const tipoConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  marco:     { label: 'Marco',       icon: Flag,        color: 'bg-brand-500/10 text-brand-600' },
  entrega:   { label: 'Entrega',     icon: Truck,       color: 'bg-purple-500/10 text-purple-600' },
  reuniao:   { label: 'Reunião',     icon: Users,       color: 'bg-blue-500/10 text-blue-600' },
  vistoria:  { label: 'Vistoria',    icon: Eye,         color: 'bg-teal-500/10 text-teal-600' },
  pagamento: { label: 'Pagamento',   icon: CreditCard,  color: 'bg-green-500/10 text-green-600' },
  outro:     { label: 'Outro',       icon: HelpCircle,  color: 'bg-lead-100 text-lead-600' },
}

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default async function CronogramaPage() {
  const supabase = await createClient()
  const { data: eventos } = await supabase
    .from('cronograma')
    .select('*, obras(nome)')
    .order('data_inicio', { ascending: true })

  const lista: EventoCronograma[] = eventos || []
  const hoje = new Date()

  const eventosProximos = lista.filter(e => new Date(e.data_inicio) >= hoje && !e.concluido).slice(0, 10)
  const eventosConcluidos = lista.filter(e => e.concluido).length

  return (
    <>
      <Header titulo="Cronograma" subtitulo="Eventos e marcos das obras" />

      <div className="p-6 space-y-5">

        {/* Resumo do mês atual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de eventos', valor: lista.length, cor: 'text-lead-900' },
            { label: 'Próximos eventos', valor: eventosProximos.length, cor: 'text-brand-600' },
            { label: 'Concluídos', valor: eventosConcluidos, cor: 'text-green-600' },
            { label: 'Mês atual', valor: meses[hoje.getMonth()], cor: 'text-lead-600' },
          ].map(item => (
            <div key={item.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
              <p className="text-xs text-lead-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Header da lista */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lead-900">Próximos eventos</h2>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo evento
          </button>
        </div>

        {/* Lista de eventos */}
        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-lead-900">Nenhum evento cadastrado</h3>
            <p className="text-lead-500 text-sm mt-1 max-w-xs">
              Adicione marcos, reuniões e entregas para acompanhar o cronograma das obras.
            </p>
            <button className="btn-primary mt-6">
              <Plus className="w-4 h-4" />
              Adicionar evento
            </button>
          </div>
        ) : (
          <div className="card divide-y divide-lead-100">
            {lista.map(evento => {
              const cfg = tipoConfig[evento.tipo] || tipoConfig.outro
              const Icon = cfg.icon
              const data = new Date(evento.data_inicio)
              const passado = data < hoje

              return (
                <div key={evento.id} className={`flex items-center gap-4 p-4 hover:bg-lead-50 transition-colors ${passado && !evento.concluido ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col items-center justify-center w-12 text-center shrink-0">
                    <span className="text-xl font-bold text-lead-900">{data.getDate()}</span>
                    <span className="text-[10px] font-semibold text-lead-400 uppercase">{meses[data.getMonth()].slice(0, 3)}</span>
                  </div>

                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${evento.concluido ? 'line-through text-lead-400' : 'text-lead-900'}`}>
                      {evento.titulo}
                    </p>
                    {evento.descricao && (
                      <p className="text-xs text-lead-500 truncate mt-0.5">{evento.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge bg-lead-100 text-lead-600 hidden sm:inline-flex">{cfg.label}</span>
                    {evento.concluido && (
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                    )}
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
