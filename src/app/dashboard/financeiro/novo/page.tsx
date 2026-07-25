'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Copy, Check, Paperclip, X, File } from 'lucide-react'

const TIPOS = [
  { value: 'materiais',             label: 'Materiais'                },
  { value: 'mao_obra',              label: 'Mão de obra'              },
  { value: 'locacao_equipamentos',  label: 'Locação de equipamentos'  },
  { value: 'reembolso',             label: 'Reembolso'                },
  { value: 'medicao_vbcon',         label: 'Medição VBCON'            },
]

const FORMAS_PAGAMENTO = [
  { value: '',               label: 'Selecione...'        },
  { value: 'pix',            label: 'PIX'                 },
  { value: 'boleto',         label: 'Boleto'              },
  { value: 'cartao_credito', label: 'Cartão de crédito'   },
]

const DADOS_PLACEHOLDER: Record<string, string> = {
  pix:            'Chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)',
  boleto:         'Código de barras ou link do boleto',
  cartao_credito: 'Link de pagamento do cartão',
}

export default function NovoLancamentoPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    obra_id: '', tipo: 'materiais', descricao: '', valor: '',
    data_referencia: new Date().toISOString().split('T')[0],
    data_vencimento: '', data_pagamento: '', status: 'pendente',
    observacoes: '', forma_pagamento: '', dados_pagamento: '',
  })

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome')
      .then(({ data }) => setObras(data || []))
  }, [])

  function set(f: string, v: string) {
    setForm(p => ({
      ...p, [f]: v,
      ...(f === 'forma_pagamento' ? { dados_pagamento: '' } : {}),
    }))
  }

  async function copiarDados() {
    if (!form.dados_pagamento) return
    await navigator.clipboard.writeText(form.dados_pagamento)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setPendingFiles(prev => [...prev, ...files])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(i: number) {
    setPendingFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  function fmtTamanho(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione uma obra.'); return }
    if (!form.valor || parseFloat(form.valor) <= 0) { setErro('Informe um valor válido.'); return }
    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: lanc, error } = await supabase.from('financeiro').insert({
      obra_id:          form.obra_id,
      tipo:             form.tipo,
      descricao:        form.descricao,
      valor:            parseFloat(form.valor),
      data_referencia:  form.data_referencia,
      data_vencimento:  form.data_vencimento  || null,
      data_pagamento:   form.data_pagamento   || null,
      status:           form.status,
      observacoes:      form.observacoes      || null,
      forma_pagamento:  form.forma_pagamento  || null,
      dados_pagamento:  form.dados_pagamento  || null,
      criado_por:       user?.id,
    }).select().single()
    if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }

    // Upload pending files
    for (const file of pendingFiles) {
      const path = `${form.obra_id}/financeiro/${lanc.id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from('documentos').upload(path, file, { cacheControl: '3600', upsert: false })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
        await supabase.from('anexos_financeiro').insert({
          financeiro_id: lanc.id,
          obra_id:       form.obra_id,
          nome:          file.name,
          url:           urlData?.publicUrl,
          tamanho:       file.size,
        })
      }
    }

    router.push('/dashboard/financeiro')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Novo Lançamento" subtitulo="Registre uma medição ou pagamento" />
      <div className="page-body max-w-2xl">
        <Link href="/dashboard/financeiro"
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

          {/* Dados principais */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados do Lançamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="select">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="select">
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="select">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">Descrição *</label>
                <input type="text" required value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  placeholder="Ex: Compra de cimento, Mão de obra elétrica..." className="input" />
              </div>

              <div>
                <label className="label">Valor (R$) *</label>
                <input type="number" required step="0.01" min="0.01"
                  value={form.valor} onChange={e => set('valor', e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Data referência</label>
                <input type="date" value={form.data_referencia} onChange={e => set('data_referencia', e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Data vencimento</label>
                <input type="date" value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Data pagamento</label>
                <input type="date" value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} className="input" />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Observações</label>
                <textarea rows={2} value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                  className="textarea" />
              </div>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Pagamento</h2>
            <div>
              <label className="label">Forma de pagamento</label>
              <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)} className="select">
                {FORMAS_PAGAMENTO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            {form.forma_pagamento && (
              <div>
                <label className="label">
                  Dados para pagamento
                  <span className="label-hint">O cliente poderá copiar com um clique</span>
                </label>
                <div className="relative">
                  <textarea rows={3} value={form.dados_pagamento}
                    onChange={e => set('dados_pagamento', e.target.value)}
                    placeholder={DADOS_PLACEHOLDER[form.forma_pagamento] || 'Cole aqui os dados de pagamento...'}
                    className="textarea pr-12" />
                  {form.dados_pagamento && (
                    <button type="button" onClick={copiarDados} title="Copiar"
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg transition-all"
                      style={{ background: copiado ? '#ecfdf5' : '#f1f5f9' }}>
                      {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-lead-400" />}
                    </button>
                  )}
                </div>
                {form.dados_pagamento && (
                  <p className="text-xs text-lead-400 mt-1.5">{copiado ? '✓ Copiado!' : 'Clique no ícone para copiar'}</p>
                )}
              </div>
            )}
          </div>

          {/* Anexos */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lead-900">Anexos</h2>
                <p className="text-xs text-lead-400 mt-0.5">Notas fiscais, boletos e comprovantes</p>
              </div>
              <label className="btn-ghost text-sm py-1.5 px-3 cursor-pointer">
                <Paperclip className="w-3.5 h-3.5" />Anexar arquivo
                <input ref={fileRef} type="file" multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  className="sr-only" onChange={addFiles} />
              </label>
            </div>
            {pendingFiles.length === 0 ? (
              <p className="text-sm text-lead-400 py-2">Nenhum arquivo selecionado.</p>
            ) : (
              <div className="space-y-2">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-lead-50 rounded-lg px-3 py-2.5">
                    <File className="w-4 h-4 text-lead-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-lead-800 truncate">{file.name}</p>
                      <p className="text-xs text-lead-400">{fmtTamanho(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)}
                      className="p-1 text-lead-300 hover:text-red-500 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/dashboard/financeiro" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                : <><Save className="w-4 h-4" />Salvar</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
