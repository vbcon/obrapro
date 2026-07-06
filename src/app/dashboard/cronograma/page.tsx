'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  CalendarDays, Plus, Flag, Truck, Users2, Eye,
  CreditCard, HelpCircle, CheckCircle2, Circle, Trash2, Building2,
} from 'lucide-react'

type Tipo = 'marco' | 'entrega' | 'reuniao' | 'vistoria' | 'pagamento' | 'outro'

interface Evento {
  id: string
  obra_id: string
  titulo: string
  descricao?: string
  tipo: Tipo
  data_inicio: string
  data_fim?: string
  concluido: boolean
  obras?: { nome: string; codigo: string }
}

const tipoConfig: Record<Tipo, { label: string; icon: React.ElementType; color: string }> = {
  marco:     { label: 'Marco',     icon: Flag,        color: 'bg-brand-500/10 text-brand-600' },
  entrega:   { label: 'Entrega',   icon: Truck,       color: 'bg-purple-500/10 text-purple-600' },
  reuniao:   { label: 'Reunião',   icon: Users2,      color: 'bg-blue-500/10 text-blue-600' },
  vistoria:  { label: 'Vistoria',  icon: Eye,         color: 'bg-teal-500/10 text-teal-600' },
  pagamento: { label: 'Pagamento', icon: CreditCard,  color: 'bg-green-500/10 text-green-600' },
  outro:     { label: 'Outro',     icon: HelpCircle,  color: 'bg-lead-100 text-lead-600' },
}

const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function CronogramaPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [obraFiltro, setObraFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [evRes, obRes] = await Promise.all([
      supabase.from('cronograma').select('*, obras(nome, codigo)').order('data_inicio', { ascending: true }),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ])
    setEventos(evRes.data || [])
    setObras(obRes.data || [])
    setCarregando(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function toggleConcluido(ev: Evento) {
    const supabase = createClient()
    await supabase.from('cronograma').update({ concluido: !ev.concluido }).eq('id', ev.id)
    setEventos(prev => prev.map(e => e.id === ev.id ? { ...e, concluido: !e.concluido } : e))
  }

  async function deletarEvento(id: string) {
    if (!confirm('Excluir este evento do cronograma?')) return
    const supabase = createClient()
    await supabase.from('cronograma').delete().eq('id', id)
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const lista = obraFiltro ? eventos.filter(e => e.obra_id === obraFiltro) : eventos
  const proximos = lista.filter(e => !e.concluido && new Date(e.data_inicio) >= hoje)
  const anteriores = lista.filter(e => e.concluido || new Date(e.data_inicio) < hoje)

  function EventoRow({ ev }: { ev: Evento }) {
    const cfg = tipoConfig[ev.tipo] || tipoConfig.outro
    const Icon = cfg.icon
    const data = new Date(ev.data_inicio + 'T00:00:00')
    const atrasado = !ev.concluido && data < hoje

    return (
      <div className={`flex items-center gap-3 px-5 py-3.5 hover:bg-lead-50 transition-colors ${atrasado ? 'bg-red-50/40' : ''}`}>
        <div className="flex flex-col items-center w-10 shrink-0 text-center">
          <span className={`text-lg font-bold leading-none ${atrasado ? 'text-red-600' : 'text-lead-900'}`}>{data.getDate()}</span>
          <span className={`text-[10px] font-semibold uppercase ${atrasado ? 'text-red-400' : 'text-lead-400'}`}>{meses[data.getMonth()]}</span>
        </div>

        <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${cfg.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${ev.concluido ? 'line-through text-lead-400' : atrasado ? 'text-red-700' : 'text-lead-900'}`}>
            {ev.titulo}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {ev.obras && (
              <span className="text-xs text-lead-400 truncate">
                <Building2 className="w-3 h-3 inline mr-0.5" />{ev.obras.codigo} — {ev.obras.nome}
              </span>
            )}
            {atrasado && <span className="text-xs text-red-500 font-medium shrink-0">Atrasado</span>}
          </div>
        </div>

        <span className={`badge hidden sm:inline-flex ${cfg.color}`}>{cfg.label}</span>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleConcluido(ev)}
            title={ev.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
            className="p-1.5 rounded-md text-lead-400 hover:text-green-600 hover:bg-green-50 transition-all"
          >
            {ev.concluido ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => deletarEvento(ev.id)}
            title="Excluir"
            className="p-1.5 rounded-md text-lead-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header titulo="Cronograma" subtitulo="Eventos e marcos das obras" />

      <div className="p-6 space-y-5">

        {/* Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',           valor: lista.length,                                                    cor: 'text-lead-900' },
            { label: 'Próximos',        valor: proximos.length,                                                 cor: 'text-brand-600' },
            { label: 'Concluídos',      valor: lista.filter(e => e.concluido).length,                          cor: 'text-green-600' },
            { label: 'Atrasados',       valor: lista.filter(e => !e.concluido && new Date(e.data_inicio) < hoje).length, cor: 'text-red-600' },
          ].map(item => (
            <div key={item.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
              <p className="text-xs text-lead-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filtro + ação */}
        <div className="flex items-center gap-3">
          <select
            value={obraFiltro}
            onChange={e => setObraFiltro(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">Todas as obras</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
          </select>
          <div className="flex-1" />
          <Link href="/dashboard/cronograma/novo" className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo evento
          </Link>
        </div>

        {carregando ? (
          <div className="card flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-lead-900">Nenhum evento</h3>
            <p className="text-lead-500 text-sm mt-1 max-w-xs">Adicione marcos, reuniões e entregas das obras.</p>
            <Link href="/dashboard/cronograma/novo" className="btn-primary mt-6">
              <Plus className="w-4 h-4" />Novo evento
            </Link>
          </div>
        ) : (
          <>
            {proximos.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-lead-100 bg-lead-50">
                  <h2 className="font-semibold text-lead-900 text-sm">Próximos eventos</h2>
                </div>
                <div className="divide-y divide-lead-100">
                  {proximos.map(ev => <EventoRow key={ev.id} ev={ev} />)}
                </div>
              </div>
            )}

            {anteriores.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-lead-100 bg-lead-50">
                  <h2 className="font-semibold text-lead-900 text-sm">Histórico</h2>
                </div>
                <div className="divide-y divide-lead-100 opacity-70">
                  {anteriores.map(ev => <EventoRow key={ev.id} ev={ev} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
