import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Inbox, Plus, ArrowUpRight, Clock, CheckCircle2, AlertCircle, MessageSquare, CircleDot } from 'lucide-react'

const CATEGORIA: Record<string, { label: string; badge: string }> = {
  solicitacao: { label: 'Solicitação', badge: 'badge-blue'    },
  reclamacao:  { label: 'Reclamação',  badge: 'badge-red'     },
  duvida:      { label: 'Dúvida',      badge: 'badge-yellow'  },
  informacao:  { label: 'Informação',  badge: 'badge-neutral' },
}

const STATUS: Record<string, { label: string; icon: React.ElementType; cor: string }> = {
  aberta:      { label: 'Aberta',      icon: CircleDot,    cor: 'text-blue-600'   },
  em_analise:  { label: 'Em análise',  icon: Clock,        cor: 'text-amber-600'  },
  respondida:  { label: 'Respondida',  icon: MessageSquare,cor: 'text-brand-600'  },
  resolvida:   { label: 'Resolvida',   icon: CheckCircle2, cor: 'text-emerald-600'},
}

function tempoRelativo(data: string) {
  const d = Math.floor((Date.now() - new Date(data).getTime()) / 86400000)
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Ontem'
  if (d < 7)   return `${d}d atrás`
  if (d < 30)  return `${Math.floor(d / 7)}sem atrás`
  return new Date(data).toLocaleDateString('pt-BR')
}

export default async function SolicitacoesPage() {
  const supabase = await createClient()

  const [{ data: solicitacoes }, { data: obras }] = await Promise.all([
    supabase.from('solicitacoes_cliente')
      .select('*, obras(nome, codigo), perfis!usuario_id(nome)')
      .order('criado_em', { ascending: false }),
    supabase.from('obras').select('id, nome, codigo').order('nome'),
  ])

  const lista = solicitacoes || []

  const kpis = {
    abertas:     lista.filter(s => s.status === 'aberta').length,
    em_analise:  lista.filter(s => s.status === 'em_analise').length,
    respondidas: lista.filter(s => s.status === 'respondida').length,
    resolvidas:  lista.filter(s => s.status === 'resolvida').length,
  }

  return (
    <>
      <Header titulo="Solicitações" subtitulo="Pedidos e dúvidas dos clientes" />

      <div className="page-body">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Abertas',      valor: kpis.abertas,     cor: 'text-blue-600',    bg: 'bg-blue-50',    Icon: CircleDot    },
            { label: 'Em análise',   valor: kpis.em_analise,  cor: 'text-amber-600',   bg: 'bg-amber-50',   Icon: Clock        },
            { label: 'Respondidas',  valor: kpis.respondidas, cor: 'text-brand-600',   bg: 'bg-brand-50',   Icon: MessageSquare},
            { label: 'Resolvidas',   valor: kpis.resolvidas,  cor: 'text-emerald-600', bg: 'bg-emerald-50', Icon: CheckCircle2 },
          ].map(k => (
            <div key={k.label} className="card p-5">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.Icon className={`w-4 h-4 ${k.cor}`} />
              </div>
              <p className={`text-2xl font-bold ${k.cor} tabular-nums leading-none`}>{k.valor}</p>
              <p className="text-xs text-lead-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Lista ── */}
        <div className="card animate-fade-up animation-delay-75">
          <div className="section-header">
            <span className="section-title">Todas as solicitações</span>
            <Link href="/dashboard/solicitacoes/nova" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              Nova solicitação
            </Link>
          </div>

          {lista.length === 0 ? (
            <div className="empty-state py-20">
              <div className="empty-state-icon">
                <Inbox className="w-6 h-6 text-lead-400" />
              </div>
              <p className="text-sm font-medium text-lead-600">Nenhuma solicitação ainda</p>
              <p className="text-xs text-lead-400 mt-1">Clientes podem enviar pedidos, dúvidas e reclamações aqui.</p>
              <Link href="/dashboard/solicitacoes/nova" className="btn-primary mt-4 btn-sm">
                <Plus className="w-3.5 h-3.5" />
                Criar primeira solicitação
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {lista.map((s: any) => {
                const cat = CATEGORIA[s.categoria] || CATEGORIA.solicitacao
                const sts = STATUS[s.status]       || STATUS.aberta
                const Icon = sts.icon
                const naoLida = s.status === 'aberta'

                return (
                  <Link key={s.id} href={`/dashboard/solicitacoes/${s.id}`}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-lead-50/70 transition-colors group">

                    {/* Status dot */}
                    <div className="mt-1 shrink-0">
                      {naoLida
                        ? <span className="w-2 h-2 rounded-full bg-blue-500 block animate-pulse-soft" />
                        : <span className="w-2 h-2 rounded-full bg-lead-200 block" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className={`text-[13px] font-semibold truncate ${naoLida ? 'text-lead-900' : 'text-lead-700'}`}>
                          {s.titulo}
                        </p>
                        <span className={cat.badge}>{cat.label}</span>
                      </div>
                      <p className="text-xs text-lead-400">
                        {s.obras?.codigo} — {s.obras?.nome}
                        {s.perfis?.nome && ` · por ${s.perfis.nome}`}
                      </p>
                      {s.descricao && (
                        <p className="text-xs text-lead-500 mt-1 line-clamp-1">{s.descricao}</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className={`flex items-center gap-1 text-xs font-medium ${sts.cor}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {sts.label}
                      </div>
                      <span className="text-xs text-lead-400">{tempoRelativo(s.criado_em)}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-lead-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
