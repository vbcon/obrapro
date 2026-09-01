'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Plus, Trash2, Camera, X, ImageIcon } from 'lucide-react'
import { comprimirImagem } from '@/lib/utils/comprimirImagem'

interface EfetivoItem { funcao: string; quantidade: string }

export default function NovoStatusObraPage() {
  const router = useRouter()
  const params = useSearchParams()
  const obraParam = params.get('obra') || ''

  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [fotosFiles, setFotosFiles] = useState<File[]>([])
  const [fotasPreviews, setFotasPreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    obra_id: obraParam,
    data: new Date().toISOString().split('T')[0],
    clima: 'ensolarado',
    atividades: '',
    ocorrencias: '',
    avisos: '',
    comentarios: '',
    efetivo_total: '0',
  })

  const [efetivo, setEfetivo] = useState<EfetivoItem[]>([{ funcao: '', quantidade: '1' }])

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome').then(({ data }) => setObras(data || []))
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

  function handleFotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setFotosFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setFotasPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removerFoto(index: number) {
    setFotosFiles(prev => prev.filter((_, i) => i !== index))
    setFotasPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione uma obra.'); return }
    if (!form.atividades) { setErro('Informe as atividades realizadas.'); return }

    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Upload fotos (comprimidas antes de enviar)
    const urlsFotos: string[] = []
    for (const original of fotosFiles) {
      const file = await comprimirImagem(original)
      const ext = file.name.split('.').pop()
      const path = `${form.obra_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('status-obra').upload(path, file)
      if (!upErr) {
        const { data } = supabase.storage.from('status-obra').getPublicUrl(path)
        urlsFotos.push(data.publicUrl)
      }
    }

    const { error } = await supabase.from('diario_obra').insert({
      obra_id: form.obra_id,
      data: form.data,
      clima: form.clima,
      atividades: form.atividades,
      ocorrencias: form.ocorrencias || null,
      avisos: form.avisos || null,
      comentarios: form.comentarios || null,
      efetivo_total: parseInt(form.efetivo_total) || 0,
      efetivo_detalhe: efetivo.filter(e => e.funcao).map(e => ({
        funcao: e.funcao,
        quantidade: parseInt(e.quantidade) || 1,
      })),
      fotos: urlsFotos,
      criado_por: user?.id,
    })

    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
    router.push('/dashboard/diario')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Novo Registro" subtitulo="Status da Obra" />

      <div className="p-6 max-w-3xl">
        <Link href="/dashboard/diario" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identificação */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => setField('obra_id', e.target.value)} className="input">
                  <option value="">Selecione...</option>
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

          {/* Fotos */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lead-900">Fotos da Obra</h2>
                <p className="text-xs text-lead-500 mt-0.5">Registre o progresso com imagens</p>
              </div>
              <label className="btn-secondary cursor-pointer">
                <Camera className="w-4 h-4" />
                Adicionar fotos
                <input type="file" accept="image/*" multiple onChange={handleFotoSelect} className="sr-only" />
              </label>
            </div>

            {fotasPreviews.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fotasPreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removerFoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-lead-200 rounded-xl text-lead-400 cursor-pointer hover:border-brand-300 hover:text-brand-500 transition-colors">
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Clique para selecionar fotos</span>
                <input type="file" accept="image/*" multiple onChange={handleFotoSelect} className="sr-only" />
              </label>
            )}
          </div>

          {/* Atividades */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Atividades e Observações</h2>
            <div>
              <label className="label">Atividades realizadas *</label>
              <textarea required rows={4} value={form.atividades} onChange={e => setField('atividades', e.target.value)} placeholder="Descreva as atividades do dia..." className="input resize-none" />
            </div>
            <div>
              <label className="label">Comentários</label>
              <textarea rows={2} value={form.comentarios} onChange={e => setField('comentarios', e.target.value)} placeholder="Notas e comentários gerais..." className="input resize-none" />
            </div>
            <div>
              <label className="label">Ocorrências / Problemas</label>
              <textarea rows={2} value={form.ocorrencias} onChange={e => setField('ocorrencias', e.target.value)} placeholder="Registre imprevistos ou pendências..." className="input resize-none" />
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
                <Plus className="w-3.5 h-3.5" />Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {efetivo.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" value={item.funcao} onChange={e => setEfetivoItem(index, 'funcao', e.target.value)} placeholder="Ex: Pedreiro, Servente..." className="input flex-1" />
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
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Salvar registro</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
