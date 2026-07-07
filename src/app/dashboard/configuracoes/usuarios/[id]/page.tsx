'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
// createClient usado apenas no useEffect para leitura (não precisa service role)
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { PAPEL_LABELS, type Papel } from '@/lib/types/roles'

export default function EditarUsuarioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([])
  const [form, setForm] = useState({ nome: '', email: '', papel: 'cliente' as Papel, empresa: '', telefone: '' })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('perfis').select('nome, email, papel, empresa, telefone').eq('id', id).single(),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
      supabase.from('usuario_obras').select('obra_id').eq('usuario_id', id),
    ]).then(([{ data: perfil }, { data: obrasData }, { data: vinculosData }]) => {
      if (!perfil) { router.push('/dashboard/configuracoes/usuarios'); return }
      setForm({
        nome: perfil.nome || '',
        email: perfil.email || '',
        papel: (perfil.papel as Papel) || 'cliente',
        empresa: perfil.empresa || '',
        telefone: perfil.telefone || '',
      })
      setObras(obrasData || [])
      setObrasSelecionadas((vinculosData || []).map(v => v.obra_id))
      setCarregando(false)
    })
  }, [id, router])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }
  function toggleObra(obraId: string) {
    setObrasSelecionadas(prev => prev.includes(obraId) ? prev.filter(x => x !== obraId) : [...prev, obraId])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (form.papel !== 'admin' && obrasSelecionadas.length === 0) {
      setErro('Selecione pelo menos uma obra para este usuário.'); return
    }
    setSalvando(true)

    const res = await fetch('/api/usuarios/atualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        nome: form.nome,
        papel: form.papel,
        empresa: form.empresa,
        telefone: form.telefone,
        obra_ids: obrasSelecionadas,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); setSalvando(false); return }

    router.push('/dashboard/configuracoes/usuarios')
    router.refresh()
  }

  if (carregando) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>

  const precisaObras = form.papel !== 'admin'

  return (
    <>
      <Header titulo="Editar Usuário" subtitulo={form.email} />
      <div className="p-6 max-w-2xl">
        <Link href="/dashboard/configuracoes/usuarios" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6"><ArrowLeft className="w-4 h-4" />Voltar</Link>

        {erro && <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6"><AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><p className="text-red-700 text-sm">{erro}</p></div>}

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
                    {p === 'admin' && 'Acesso total'}
                    {p === 'cliente' && 'Suas obras, todos os módulos'}
                    {p === 'arquiteto' && 'Cronograma e diário'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dados */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados do usuário</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome</label>
                <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">E-mail</label>
                <input type="email" value={form.email} disabled className="input opacity-60 cursor-not-allowed" />
                <p className="text-xs text-lead-400 mt-1">O e-mail não pode ser alterado aqui.</p>
              </div>
              <div>
                <label className="label">Empresa</label>
                <input type="text" value={form.empresa} onChange={e => set('empresa', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input type="text" value={form.telefone} onChange={e => set('telefone', e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Obras vinculadas */}
          {precisaObras && (
            <div className="card p-6">
              <h2 className="font-semibold text-lead-900 mb-1">Obras com acesso *</h2>
              <p className="text-sm text-lead-500 mb-4">Quais obras este usuário pode visualizar.</p>
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
              {salvando ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</> : <><Save className="w-4 h-4" />Salvar</>}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
