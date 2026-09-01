'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Plus, Trash2, Camera, X, Loader2 } from 'lucide-react'

interface EfetivoItem { funcao: string; quantidade: string }

const CLIMAS = [
  { value: 'ensolarado', label: 'Ensolarado' },
  { value: 'parcialmente_nublado', label: 'Parcialmente nublado' },
  { value: 'nublado', label: 'Nublado' },
  { value: 'chuvoso', label: 'Chuvoso' },
]

export default function EditarStatusObraPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [obraNome, setObraNome] = useState('')

  const [form, setForm] = useState({
    data: '', clima: 'ensolarado', atividades: '',
    ocorrencias: '', avisos: '', comentarios: '', efetivo_total: '0',
  })
  const [efetivo, setEfetivo] = useState<EfetivoItem[]>([{ funcao: '', quantidade: '1' }])
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([])
  const [novasFotos, setNovasFotos] = useState<File[]>([])
  const [novasPreviews, setNovasPreviews] = useState<string[]>([])
  const [obraId, setObraId] = useState('')

  useEffect(() => {
    createClient().from('diario_obra').select('*, obras(nome, codigo)').eq('id', id).single()
      .then(({ data }) => {
        if (!data) { setErro('Registro não encontrado.'); setCarregando(false); return }
        setObraId(data.obra_id)
        setObraNome(data.obras ? `${data.obras.codigo} — ${data.obras.nome}` : '')
        setForm({
          data:          data.data,
          clima:         data.clima || 'ensolarado',
          atividades:    data.atividades || '',
          ocorrencias:   data.ocorrencias || '',
          avisos:        data.avisos || '',
          comentarios:   data.comentarios || '',
          efetivo_total: String(data.efetivo_total || 0),
        })
        const det = Array.isArray(data.efetivo_detalhe) ? data.efetivo_detalhe : []
        setEfetivo(det.length > 0
          ? det.map((e: any) => ({ funcao: e.funcao, quantidade: String(e.quantidade) }))
          : [{ funcao: '', quantidade: '1' }])
        setFotosExistentes(Array.isArray(data.fotos) ? data.fotos : [])
        setCarregando(false)
      })
  }, [id])

  useEffect(() => {
    const total = efetivo.reduce((acc, e) => acc + (parseInt(e.quantidade) || 0), 0)
    setForm(prev => ({ ...prev, efetivo_total: String(total) }))
  }, [efetivo])

  function setField(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }
  function setEfetivoItem(i: number, f: keyof EfetivoItem, v: string) {
    setEfetivo(prev => prev.map((item, idx) => idx === i ? { ...item, [f]: v } : item))
  }
  function addEfetivo() { setEfetivo(prev => [...prev, { funcao: '', quantidade: '1' }]) }
  function removeEfetivo(i: number) { setEfetivo(prev => prev.filter((_, idx) => idx !== i)) }

  function handleFotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setNovasFotos(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setNovasPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }
  function removerFotoExistente(i: number) { setFotosExistentes(prev => prev.filter((_, idx) => idx !== i)) }
  function removerNovaFoto(i: number) {
    setNovasFotos(prev => prev.filter((_, idx) => idx !== i))
    setNovasPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.atividades) { setErro('Informe as atividades realizadas.'); return }

    setSalvando(true)
    const supabase = createClient()

    // Upload novas fotos
    const urlsNovas: string[] = []
    for (const file of novasFotos) {
      const ext = file.name.split('.').pop()
      const path = `${obraId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('status-obra').upload(path, file)
      if (!upErr) {
        const { data } = supabase.storage.from('status-obra').getPublicUrl(path)
        urlsNovas.push(data.publicUrl)
      }
    }

    const { error } = await supabase.from('diario_obra').update({
      data: form.data,
      clima: form.clima,
      atividades: form.atividades,
      ocorrencias: form.ocorrencias || null,
      avisos: form.avisos || null,
      comentarios: form.comentarios || null,
      efetivo_total: parseInt(form.efetivo_total) || 0,
      efetivo_detalhe: efetivo.filter(e => e.funcao).map(e => ({
        funcao: e.funcao, quantidade: parseInt(e.quantidade) || 1,
      })),
      fotos: [...fotosExistentes, ...urlsNovas],
    }).eq('id', id)

    if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
    router.push(`/dashboard/diario/${id}`)
    router.refresh()
  }

  if (carregando) {
    return (
      <>
        <Header titulo="Editar Status" subtitulo="Carregando..." />
        <div className="p-6 flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <Header titulo="Editar Status da Obra" subtitulo={obraNome} />

      <div className="p-6 max-w-3xl space-y-5">
        <Link href={`/dashboard/diario/${id}`}
          className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Dados principais */}
          <div className="card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Data</label>
                <input type="date" value={form.data} onChange={e => setField('data', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Clima</label>
                <select value={form.clima} onChange={e => setField('clima', e.target.value)} className="select">
                  {CLIMAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Atividades realizadas *</label>
              <textarea rows={4} value={form.atividades} onChange={e => setField('atividades', e.target.value)}
                placeholder="Descreva o que foi executado..." className="textarea" />
            </div>
          </div>

          {/* Fotos */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lead-900">Fotos</h2>
              <label className="btn-ghost text-sm py-1.5 px-3 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />Adicionar
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFotoSelect} />
              </label>
            </div>
            {(fotosExistentes.length + novasPreviews.length) === 0 ? (
              <p className="text-sm text-lead-400 py-2">Nenhuma foto.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fotosExistentes.map((url, i) => (
                  <div key={`e-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-lead-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removerFotoExistente(i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {novasPreviews.map((url, i) => (
                  <div key={`n-${i}`} className="relative aspect-video rounded-lg overflow-hidden border-2 border-brand-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Nova ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded">Nova</span>
                    <button type="button" onClick={() => removerNovaFoto(i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Efetivo */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lead-900">Efetivo <span className="text-sm font-normal text-lead-400">({form.efetivo_total} pessoas)</span></h2>
              <button type="button" onClick={addEfetivo} className="btn-ghost text-sm py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {efetivo.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item.funcao} onChange={e => setEfetivoItem(i, 'funcao', e.target.value)}
                    placeholder="Função (ex: Pedreiro)" className="input flex-1" />
                  <input type="number" min="0" value={item.quantidade} onChange={e => setEfetivoItem(i, 'quantidade', e.target.value)}
                    className="input w-24 text-center" />
                  <button type="button" onClick={() => removeEfetivo(i)}
                    className="p-2 text-lead-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ocorrências, avisos, comentários */}
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Ocorrências</label>
              <textarea rows={2} value={form.ocorrencias} onChange={e => setField('ocorrencias', e.target.value)}
                placeholder="Problemas, atrasos, imprevistos..." className="textarea" />
            </div>
            <div>
              <label className="label">Avisos</label>
              <textarea rows={2} value={form.avisos} onChange={e => setField('avisos', e.target.value)}
                placeholder="Avisos importantes..." className="textarea" />
            </div>
            <div>
              <label className="label">Comentários</label>
              <textarea rows={2} value={form.comentarios} onChange={e => setField('comentarios', e.target.value)}
                placeholder="Observações gerais..." className="textarea" />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href={`/dashboard/diario/${id}`} className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                : <><Save className="w-4 h-4" />Salvar alterações</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
