'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  ArrowLeft, MessageSquare, Send, CheckCircle2, Clock,
  CircleDot, AlertCircle, Building2, User, Calendar,
} from 'lucide-react'

const CATEGORIA_LABEL: Record<string, string> = {
  solicitacao: 'Solicitação',
  reclamacao:  'Reclamação',
  duvida:      'Dúvida',
  informacao:  'Informação',
}
const CATEGORIA_BADGE: Record<string, string> = {
  solicitacao: 'badge-blue',
  reclamacao:  'badge-red',
  duvida:      'badge-yellow',
  informacao:  'badge-neutral',
}

const STATUS_OPTS = [
  { value: 'aberta',      label: 'Aberta'      },
  { value: 'em_analise',  label: 'Em análise'  },
  { value: 'respondida',  label: 'Respondida'  },
  { value: 'resolvida',   label: 'Resolvida'   },
]

function fmtData(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SolicitacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [sol, setSol] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [papel, setPapel] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  const [resposta, setResposta] = useState('')
  const [status, setStatus] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: perfil } = await supabase.from('perfis').select('papel').eq('id', user.id).single()
      setPapel(perfil?.papel || 'cliente')

      const { data } = await supabase.from('solicitacoes_cliente')
        .select('*, obras(nome, codigo), perfis!usuario_id(nome, email), perfis!respondido_por(nome)')
        .eq('id', id)
        .single()

      if (data) {
        setSol(data)
        setResposta(data.resposta || '')
        setStatus(data.status)
      }
      setCarregando(false)
    }
    load()
  }, [id])

  async function handleSalvar() {
    setErro('')
    setSalvando(true)

    const update: any = { status, atualizado_em: new Date().toISOString() }

    if (resposta.trim() && resposta.trim() !== (sol.resposta || '')) {
      update.resposta = resposta.trim()
      update.respondido_por = userId
      update.respondido_em = new Date().toISOString()
      if (status === 'aberta') update.status = 'respondida'
    }

    const { error } = await supabase.from('solicitacoes_cliente').update(update).eq('id', id)
    if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }

    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
    setSol((p: any) => ({ ...p, ...update }))
    setSalvando(false)
  }

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )
  if (!sol) return null

  const isAdmin = papel === 'admin'
  const obra = sol.obras
  const solicitante = sol['perfis!usuario_id'] || sol.perfis
  const respondente = sol['perfis!respondido_por']
  const catBadge = CATEGORIA_BADGE[sol.categoria] || 'badge-neutral'
  const catLabel = CATEGORIA_LABEL[sol.categoria] || sol.categoria

  return (
    <>
      <Header titulo="Solicitação" subtitulo={sol.titulo} />

      <div className="page-body max-w-3xl">
        <Link href="/dashboard/solicitacoes"
          className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {/* ── Cabeçalho da solicitação ── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={catBadge}>{catLabel}</span>
              <span className="text-xs text-lead-400">#{sol.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              {STATUS_OPTS.find(s => s.value === (status || sol.status)) && (
                isAdmin ? (
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="select text-xs py-1.5 h-auto w-auto"
                  >
                    {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-medium text-lead-600 bg-lead-100 px-2 py-1 rounded-md">
                    {STATUS_OPTS.find(s => s.value === sol.status)?.label}
                  </span>
                )
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-lead-900">{sol.titulo}</h2>

          {sol.descricao && (
            <p className="text-sm text-lead-600 whitespace-pre-wrap leading-relaxed">{sol.descricao}</p>
          )}

          <div className="flex flex-wrap gap-4 pt-2 border-t border-lead-100 text-xs text-lead-500">
            {obra && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{obra.codigo} — {obra.nome}</span>
              </div>
            )}
            {solicitante?.nome && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{solicitante.nome}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{fmtData(sol.criado_em)}</span>
            </div>
          </div>
        </div>

        {/* ── Resposta existente ── */}
        {sol.resposta && !isAdmin && (
          <div className="card p-5 border-l-4 border-l-brand-400">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <p className="text-sm font-semibold text-lead-900">Resposta</p>
            </div>
            <p className="text-sm text-lead-700 whitespace-pre-wrap leading-relaxed">{sol.resposta}</p>
            {respondente?.nome && (
              <p className="text-xs text-lead-400 mt-3">
                por {respondente.nome}
                {sol.respondido_em && ` · ${fmtData(sol.respondido_em)}`}
              </p>
            )}
          </div>
        )}

        {/* ── Painel admin ── */}
        {isAdmin && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-lead-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              Resposta ao cliente
            </h3>

            {erro && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm">{erro}</p>
              </div>
            )}
            {sucesso && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-emerald-700 text-sm">Salvo com sucesso.</p>
              </div>
            )}

            <textarea
              rows={5}
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              placeholder="Escreva a resposta para o cliente..."
              className="textarea"
            />

            {sol.respondido_em && (
              <p className="text-xs text-lead-400">
                Última resposta: {fmtData(sol.respondido_em)}
                {respondente?.nome && ` por ${respondente.nome}`}
              </p>
            )}

            <div className="flex justify-end">
              <button onClick={handleSalvar} disabled={salvando} className="btn-primary">
                {salvando
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                  : <><Send className="w-4 h-4" />Salvar resposta</>
                }
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
