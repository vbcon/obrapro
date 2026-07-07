'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { PAPEL_LABELS, type Papel } from '@/lib/types/roles'

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', papel: 'cliente' as Papel, empresa: '', telefone: '' })
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([])

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome').then(({ data }) => setObras(data || []))
  }, [])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function toggleObra(id: string) {
    setObrasSelecionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!form.nome || !form.email || !form.senha) { setErro('Preencha nome, e-mail e senha.'); return }
    if (form.senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres.'); return }
    if (form.papel !== 'admin' && obrasSelecionadas.length === 0) {
      setErro('Selecione pelo menos uma obra para este usuário.'); return
    }

    setSalvando(true)
    const res = await fetch('/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        papel: form.papel,
        obra_ids: obrasSelecionadas,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErro(data.error || 'Erro ao criar usuário.')
      setSalvando(false)
      return
    }

    setSucesso(`Usuário ${form.nome} criado com sucesso! Um e-mail foi enviado para ${form.email} para redefinição de senha.`)
    setSalvando(false)
  }

  if (sucesso) {
    return (
      <>
        <Header titulo="Novo Usuário" subtitulo="Usuário criado" />
        <div className="p-6 max-w-2xl">
          <div className="card p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-lead-900">Usuário criado!</h2>
              <p className="text-sm text-lead-500 mt-2 max-w-sm">{sucesso}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setSucesso(''); setForm({ nome: '', email: '', senha: '', papel: 'cliente', empresa: '', telefone: '' }); setObrasSelecionadas([]) }}
                className="btn-secondary"
              >
                Criar outro
              </button>
              <Link href="/dashboard/configuracoes/usuarios" className="btn-primary">
                Ver usuários
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const precisaObras = form.papel !== 'admin'

  return (
    <>
      <Header titulo="Novo Usuário" subtitulo="Crie um acesso para cliente ou arquiteto" />
      <div className="p-6 max-w-2xl">
        <Link href="/dashboard/configuracoes/usuarios" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Papel */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Tipo de acesso</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['admin', 'cliente', 'arquiteto'] as Papel[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { set('papel', p); if (p === 'admin') setObrasSelecionadas([]) }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${form.papel === p ? 'border-brand-500 bg-brand-50' : 'border-lead-200 hover:border-lead-300'}`}
                >
                  <p className={`font-semibold text-sm ${form.papel === p ? 'text-brand-700' : 'text-lead-700'}`}>{PAPEL_LABELS[p]}</p>
                  <p className="text-xs text-lead-500 mt-1">
                    {p === 'admin' && 'Acesso total ao sistema'}
                    {p === 'cliente' && 'Suas obras: compras, financeiro, diário'}
                    {p === 'arquiteto' && 'Cronograma e diário apenas'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados do usuário</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome completo *</label>
                <input type="text" required value={form.nome} onChange={e => set('nome', e.target.value)} className="input" placeholder="Ex: João da Silva" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">E-mail *</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className="input" placeholder="usuario@email.com" />
              </div>
              <div className="sm:col-span-2 relative">
                <label className="label">Senha inicial *</label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  value={form.senha}
                  onChange={e => set('senha', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input pr-11"
                />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-9 text-lead-400 hover:text-lead-600">
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <p className="text-xs text-lead-400 mt-1">Compartilhe com o usuário. Ele poderá alterar depois em "Esqueci minha senha".</p>
              </div>
              <div>
                <label className="label">Empresa</label>
                <input type="text" value={form.empresa} onChange={e => set('empresa', e.target.value)} className="input" placeholder="Nome da empresa" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input type="text" value={form.telefone} onChange={e => set('telefone', e.target.value)} className="input" placeholder="(11) 9 9999-9999" />
              </div>
            </div>
          </div>

          {/* Obras vinculadas */}
          {precisaObras && (
            <div className="card p-6">
              <h2 className="font-semibold text-lead-900 mb-1">Obras com acesso *</h2>
              <p className="text-sm text-lead-500 mb-4">Selecione quais obras este usuário pode visualizar.</p>
              {obras.length === 0 ? (
                <p className="text-sm text-lead-400">Nenhuma obra cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {obras.map(o => {
                    const sel = obrasSelecionadas.includes(o.id)
                    return (
                      <label key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-brand-400 bg-brand-50' : 'border-lead-200 hover:border-lead-300'}`}>
                        <input type="checkbox" checked={sel} onChange={() => toggleObra(o.id)} className="accent-brand-500 w-4 h-4" />
                        <div>
                          <p className="font-medium text-lead-900 text-sm">{o.nome}</p>
                          {o.codigo && <p className="text-xs text-lead-500">{o.codigo}</p>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/dashboard/configuracoes/usuarios" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Criando...</>
                : <><UserPlus className="w-4 h-4" />Criar usuário</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
