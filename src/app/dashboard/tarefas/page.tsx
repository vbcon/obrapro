'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  ListTodo, Plus, CheckCircle2, Circle, Trash2,
  AlertTriangle, Flag, HardHat,
} from 'lucide-react'

const PRIORIDADE: Record<string, { label: string; cor: string }> = {
  baixa:   { label: 'Baixa',   cor: 'text-lead-400'  },
  normal:  { label: 'Normal',  cor: 'text-blue-600'  },
  alta:    { label: 'Alta',    cor: 'text-amber-600' },
  urgente: { label: 'Urgente', cor: 'text-red-600'   },
}

function fmtData(d?: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function TarefasModuloPage() {
  const [tarefas, setTarefas]   = useState<any[]>([])
  const [obras, setObras]       = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro]     = useState<'pendentes' | 'todas' | 'concluidas'>('pendentes')
  const [filtroObra, setFiltroObra] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [nova, setNova] = useState({
    obra_id: '', titulo: '', responsavel: '', prioridade: 'normal', data_prevista: '',
  })
  const [erro, setErro] = useState('')

  async function carregar() {
    const supabase = createClient()
    const [{ data: t }, { data: o }] = await Promise.all([
      supabase.from('tarefas').select('*, obras(id, nome, codigo)').order('concluida').order('prioridade').order('criado_em'),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ])
    setTarefas(t || [])
    setObras(o || [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])
  useEffect(() => { if (adicionando) inputRef.current?.focus() }, [adicionando])

  async function toggleConcluida(t: any) {
    const supabase = createClient()
    const concluida = !t.concluida
    await supabase.from('tarefas').update({
      concluida, concluida_em: concluida ? new Date().toISOString() : null,
    }).eq('id', t.id)
    setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, concluida, concluida_em: concluida ? new Date().toISOString() : null } : x))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta tarefa?')) return
    const supabase = createClient()
    await supabase.from('tarefas').delete().eq('id', id)
    setTarefas(prev => prev.filter(x => x.id !== id))
  }

  async function salvarNova(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nova.obra_id) { setErro('Selecione a obra.'); return }
    if (!nova.titulo.trim()) { setErro('Informe o título da tarefa.'); return }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('tarefas').insert({
      obra_id:       nova.obra_id,
      titulo:        nova.titulo.trim(),
      responsavel:   nova.responsavel || null,
      prioridade:    nova.prioridade,
      data_prevista: nova.data_prevista || null,
      criado_por:    user?.id,
    }).select('*, obras(id, nome, codigo)').single()
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    if (data) {
      setTarefas(prev => [data, ...prev])
      setNova(p => ({ ...p, titulo: '', responsavel: '', data_prevista: '' }))
      inputRef.current?.focus()
    }
  }

  const lista = tarefas.filter(t => {
    if (filtroObra && t.obra_id !== filtroObra) return false
    if (filtro === 'pendentes')  return !t.concluida
    if (filtro === 'concluidas') return t.concluida
    return true
  })

  const pendentes  = tarefas.filter(t => !t.concluida).length
  const concluidas = tarefas.filter(t => t.concluida).length
  const urgentes   = tarefas.filter(t => !t.concluida && t.prioridade === 'urgente').length

  return (
    <>
      <Header titulo="Tarefas" subtitulo="Pendências das obras" />

      <div className="page-body max-w-4xl">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-lead-900 tabular-nums">{pendentes}</p>
            <p className="text-xs text-lead-400 mt-1">Pendentes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{concluidas}</p>
            <p className="text-xs text-lead-400 mt-1">Concluídas</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600 tabular-nums">{urgentes}</p>
            <p className="text-xs text-lead-400 mt-1">Urgentes</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-lead-200 p-0.5 bg-lead-50 gap-0.5">
            {(['pendentes', 'todas', 'concluidas'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  filtro === f ? 'bg-white shadow-sm text-lead-900' : 'text-lead-500 hover:text-lead-700'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} className="select select-sm max-w-[220px]">
            <option value="">Todas as obras</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
          </select>
          <div className="flex-1" />
          <button onClick={() => setAdicionando(v => !v)} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />Nova tarefa
          </button>
        </div>

        {/* Form nova tarefa */}
        {adicionando && (
          <div className="card p-5 border-2 border-brand-200 animate-fade-up">
            {erro && (
              <div className="flex items-start gap-2 mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}
            <form onSubmit={salvarNova} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select required value={nova.obra_id}
                  onChange={e => setNova(p => ({ ...p, obra_id: e.target.value }))} className="select">
                  <option value="">Selecione a obra *</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
                <input ref={inputRef} type="text" required value={nova.titulo}
                  onChange={e => setNova(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Título da tarefa *" className="input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={nova.responsavel}
                  onChange={e => setNova(p => ({ ...p, responsavel: e.target.value }))}
                  placeholder="Responsável" className="input" />
                <select value={nova.prioridade}
                  onChange={e => setNova(p => ({ ...p, prioridade: e.target.value }))} className="select">
                  {Object.entries(PRIORIDADE).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <input type="date" value={nova.data_prevista}
                  onChange={e => setNova(p => ({ ...p, data_prevista: e.target.value }))} className="input" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAdicionando(false)} className="btn-secondary btn-sm">Cancelar</button>
                <button type="submit" className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" />Adicionar</button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        <div className="card overflow-hidden">
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
          ) : lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListTodo className="w-8 h-8 text-lead-200 mb-3" />
              <p className="text-sm font-medium text-lead-500">
                {filtro === 'concluidas' ? 'Nenhuma tarefa concluída' :
                 filtro === 'pendentes'  ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa'}
              </p>
              {tarefas.length === 0 && obras.length > 0 && (
                <button onClick={() => setAdicionando(true)} className="btn-primary btn-sm mt-4">
                  <Plus className="w-3.5 h-3.5" />Adicionar tarefa
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {lista.map(t => {
                const pri = PRIORIDADE[t.prioridade] || PRIORIDADE.normal
                const vencida = !t.concluida && t.data_prevista && new Date(t.data_prevista + 'T00:00:00') < new Date()
                return (
                  <div key={t.id}
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-lead-50/60 transition-colors group
                      ${t.concluida ? 'opacity-60' : ''} ${vencida ? 'bg-red-50/40' : ''}`}>

                    <button onClick={() => toggleConcluida(t)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                      {t.concluida
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <Circle className={`w-5 h-5 ${vencida ? 'text-red-400' : 'text-lead-300'} hover:text-brand-500`} />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${t.concluida ? 'line-through text-lead-400' : 'text-lead-900'}`}>
                        {t.titulo}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Link href={`/dashboard/obras/${t.obra_id}`}
                          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
                          <HardHat className="w-3 h-3" />
                          {t.obras?.codigo}
                        </Link>
                        {t.responsavel && <span className="text-xs text-lead-400">{t.responsavel}</span>}
                        {t.data_prevista && (
                          <span className={`text-xs flex items-center gap-1 ${vencida ? 'text-red-500 font-medium' : 'text-lead-400'}`}>
                            {vencida && <AlertTriangle className="w-3 h-3" />}
                            {fmtData(t.data_prevista)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1 text-xs font-medium ${pri.cor}`}>
                        <Flag className="w-3 h-3" />
                        <span className="hidden sm:inline">{pri.label}</span>
                      </span>
                      <button onClick={() => excluir(t.id)}
                        className="p-1.5 rounded-md text-lead-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
