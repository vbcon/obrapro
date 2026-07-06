'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Plus, Trash2 } from 'lucide-react'

interface EfetivoItem { funcao: string; quantidade: string }

export default function NovoDiarioPage() {
  const router = useRouter()
  const params = useSearchParams()
  const obraParam = params.get('obra') || ''

  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    obra_id: obraParam,
    data: new Date().toISOString().split('T')[0],
    clima: 'ensolarado',
    atividades: '',
    ocorrencias: '',
    avisos: '',
    efetivo_total: '0',
  })

  const [efetivo, setEfetivo] = useState<EfetivoItem[]>([
    { funcao: '', quantidade: '1' }
  ])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('obras').select('id, nome, codigo').order('nome').then(({ data }) => {
      setObras(data || [])
    })
  }, [])

  useEffect(() => {
    const total = efetivo.reduce((acc, e) => acc + (parseInt(e.quantidade) || 0), 0)
    setForm(prev => ({ ...prev, efetivo_total: String(total) }))
  }, [efetivo])

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setEfetivoItem(index: number, field: keyof EfetivoItem, value: string) {
    setEfetivo(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione uma obra.'); return }
    if (!form.atividades) { setErro('Informe as atividades realizadas.'); return }

    setCarregando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('diario_obra').insert({
      obra_id: form.obra_id,
      data: form.data,
      clima: form.clima,
      atividades: form.atividades,
      ocorrencias: form.ocorrencias || null,
      avisos: form.avisos || null,
      efetivo_total: parseInt(form.efetivo_total) || 0,
      efetivo_detalhe: efetivo.filter(e => e.funcao).map(e => ({
        funcao: e.funcao,
        quantidade: parseInt(e.quantidade) || 1,
      })),
      criado_por: user?.id,
    })

    if (error) {
      setErro('Erro ao salvar RDO. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/dashboard/diario')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Novo RDO" subtitulo="Relatório Diário de Obra" />

      <div className="p-6 max-w-3xl">
        <Link href="/dashboard/diario" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Cabeçalho */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => setField('obra_id', e.target.value)} className="input">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" value={form.data} onChange={e => setField('data', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Clima</label>
                <select value={form.clima} onChange={e => setField('clima', e.target.value)} className="input">
                  <option value="ensolarado">☀️ Ensolarado</option>
                  <option value="parcialmente_nublado">⛅ Parcialmente nublado</option>
                  <option value="nublado">☁️ Nublado</option>
                  <option value="chuvoso">🌧️ Chuvoso</option>
                </select>
              </div>
            </div>
          </div>

          {/* Atividades */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Atividades do Dia</h2>
            <div>
              <label className="label">Atividades realizadas *</label>
              <textarea required rows={5} value={form.atividades} onChange={e => setField('atividades', e.target.value)} placeholder="Descreva as atividades realizadas no dia..." className="input resize-none" />
            </div>
            <div>
              <label className="label">Ocorrências / Problemas</label>
              <textarea rows={3} value={form.ocorrencias} onChange={e => setField('ocorrencias', e.target.value)} placeholder="Registre problemas, imprevistos ou pendências..." className="input resize-none" />
            </div>
            <div>
              <label className="label">Avisos / Comunicados</label>
              <textarea rows={2} value={form.avisos} onChange={e => setField('avisos', e.target.value)} placeholder="Avisos para a equipe ou cliente..." className="input resize-none" />
            </div>
          </div>

          {/* Efetivo */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lead-900">Efetivo no Canteiro</h2>
                <p className="text-xs text-lead-500 mt-0.5">Total: <span className="font-semibold text-brand-600">{form.efetivo_total} pessoas</span></p>
              </div>
              <button type="button" onClick={() => setEfetivo(p => [...p, { funcao: '', quantidade: '1' }])} className="btn-ghost text-sm py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {efetivo.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" value={item.funcao} onChange={e => setEfetivoItem(index, 'funcao', e.target.value)} placeholder="Ex: Pedreiro, Servente, Engenheiro..." className="input flex-1" />
                  <input type="number" min="1" value={item.quantidade} onChange={e => setEfetivoItem(index, 'quantidade', e.target.value)} className="input w-20 text-center" />
                  <button type="button" onClick={() => setEfetivo(p => p.filter((_, i) => i !== index))} disabled={efetivo.length === 1} className="p-2 text-lead-400 hover:text-red-500 disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/diario" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={carregando} className="btn-primary">
              {carregando ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
              ) : (
                <><Save className="w-4 h-4" />Salvar RDO</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
