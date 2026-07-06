'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FolderOpen, Upload, Trash2, FileText, FileImage, File, ExternalLink, Loader2 } from 'lucide-react'

interface Arquivo {
  id: string
  nome: string
  tipo?: string
  tamanho?: number
  storage_path: string
  criado_em: string
}

interface Props {
  obraId: string
  arquivosIniciais: Arquivo[]
}

function FileIcon({ tipo }: { tipo?: string }) {
  if (!tipo) return <File className="w-4 h-4" />
  if (tipo.startsWith('image/')) return <FileImage className="w-4 h-4 text-blue-500" />
  if (tipo === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />
  return <File className="w-4 h-4 text-lead-400" />
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjetosSection({ obraId, arquivosIniciais }: Props) {
  const [arquivos, setArquivos] = useState<Arquivo[]>(arquivosIniciais)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setErro('')
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const slug = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `obras/${obraId}/${Date.now()}-${slug}`

      const { error: upErr } = await supabase.storage.from('projetos').upload(path, file)
      if (upErr) { setErro(`Erro ao enviar "${file.name}"`); continue }

      const { data: dbData, error: dbErr } = await supabase.from('obra_arquivos').insert({
        obra_id: obraId,
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        storage_path: path,
        criado_por: user?.id,
      }).select().single()

      if (!dbErr && dbData) {
        setArquivos(prev => [dbData, ...prev])
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(arquivo: Arquivo) {
    if (!confirm(`Excluir "${arquivo.nome}"?`)) return
    const supabase = createClient()
    await supabase.storage.from('projetos').remove([arquivo.storage_path])
    await supabase.from('obra_arquivos').delete().eq('id', arquivo.id)
    setArquivos(prev => prev.filter(a => a.id !== arquivo.id))
  }

  function getPublicUrl(path: string) {
    const supabase = createClient()
    return supabase.storage.from('projetos').getPublicUrl(path).data.publicUrl
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lead-900 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-brand-500" />
          Projetos e Arquivos
        </h3>
        <label className={`btn-secondary cursor-pointer text-sm py-1.5 px-3 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Enviando...' : 'Enviar arquivo'}
          <input type="file" multiple onChange={handleUpload} className="sr-only" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.zip" />
        </label>
      </div>

      {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}

      {arquivos.length === 0 ? (
        <label className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-lead-200 rounded-xl text-lead-400 cursor-pointer hover:border-brand-300 hover:text-brand-500 transition-colors">
          <FolderOpen className="w-8 h-8" />
          <span className="text-sm">Clique para enviar plantas, PDFs, memoriais...</span>
          <input type="file" multiple onChange={handleUpload} className="sr-only" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.zip" />
        </label>
      ) : (
        <div className="space-y-1">
          {arquivos.map(arquivo => (
            <div key={arquivo.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-lead-50 transition-colors group">
              <FileIcon tipo={arquivo.tipo} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-lead-900 truncate">{arquivo.nome}</p>
                <p className="text-xs text-lead-400">{formatBytes(arquivo.tamanho)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={getPublicUrl(arquivo.storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-lead-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                  title="Abrir"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(arquivo)}
                  className="p-1.5 rounded-md text-lead-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
