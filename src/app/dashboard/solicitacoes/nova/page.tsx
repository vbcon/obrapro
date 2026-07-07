'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'

const CATEGORIAS = [
  { value: 'solicitacao', label: 'Solicitação' },
  { value: 'reclamacao',  label: 'Reclamação'  },
  { value: 'duvida',      label: 'Dúvida'      },
  { value: 'informacao',  label: 'Informação'  },
]

export default function NovaSolicitacaoPage() {
  const router = useRouter()
  const params = useSearchParams()
  const obraParam = params.get('obra') || ''

  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    obra_id: obraParam,
    titulo: '',
    categoria: 'solicitacao',
    descricao: '',
  })

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome')
      .then(({ data }) => setObras(data || []))
  }, [])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione a obra.'); return }
    if (!form.titulo)   { setErro('Informe o título.'); return }

    setEnviando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('solicitacoes_cliente').insert({
      obra_id: form.obra_id,
      usuario_id: user?.id,
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      descricao: form.descricao.trim() || null,
      status: 'aberta',
    })

    if (error) { setErro('Erro ao enviar. Tente novamente.'); setEnviando(false); return }
    router.push('/dashboard/solicitacoes')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Nova Solicitação" subtitulo="Envie um pedido ou dúvida ao responsável" />

      <div className="page-body max-w-2xl">
        <Link href="/dashboard/solicitacoes"
          className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados da solicitação</h2>

            <div>
              <label className="label">Obra *</label>
              <select required value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="select">
                <option value="">Selecione a obra...</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Categoria *</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="select">
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Título *</label>
              <input
                type="text" required
                value={form.titulo} onChange={e => set('titulo', e.target.value)}
                placeholder="Resuma sua solicitação em uma linha"
                className="input"
                maxLength={120}
              />
            </div>

            <div>
              <label className="label">
                Descrição
                <span className="label-hint">Detalhes, contexto, o que está acontecendo</span>
              </label>
              <textarea
                rows={5}
                value={form.descricao} onChange={e => set('descricao', e.target.value)}
                placeholder="Descreva com detalhes o que precisa, o problema ou a dúvida..."
                className="textarea"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/solicitacoes" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={enviando} className="btn-primary">
              {enviando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</>
                : <><Send className="w-4 h-4" />Enviar solicitação</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
