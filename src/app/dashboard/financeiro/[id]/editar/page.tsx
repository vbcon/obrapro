'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Trash2, Copy, Check } from 'lucide-react'

const TIPOS = [
  { value: 'materiais',             label: 'Materiais'                },
  { value: 'mao_obra',              label: 'Mão de obra'              },
  { value: 'locacao_equipamentos',  label: 'Locação de equipamentos'  },
  { value: 'reembolso',             label: 'Reembolso'                },
  { value: 'medicao_vbcon',         label: 'Medição VBCON'            },
]

const FORMAS_PAGAMENTO = [
  { value: '',               label: 'Selecione...'       },
  { value: 'pix',            label: 'PIX'                },
  { value: 'boleto',         label: 'Boleto'             },
  { value: 'cartao_credito', label: 'Cartão de crédito'  },
]

const DADOS_PLACEHOLDER: Record<string, string> = {
  pix:            'Chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)',
  boleto:         'Código de barras ou link do boleto',
  cartao_credito: 'Link de pagamento do cartão',
}

export default function EditarLancamentoPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')
  const [copiado, setCopiado]       = useState(false)
  const [obras, setObras]           = useState<{ id: string; nome: string; codigo: string }[]>([])

  const [form, setForm] = useState({
    obra_id: '', tipo: 'materiais', descricao: '', valor: '',
    data_referencia: '', data_vencimento: '', data_pagamento: '',
    status: 'pendente', observacoes: '', forma_pagamento: '', dados_pagamento: '',
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('financeiro').select('*').eq('id', id).single(),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ]).then(([{ data }, { data: obrasData }]) => {
      if (!data) { router.push('/dashboard/financeiro'); return }
      setForm({
        obra_id:          data.obra_id,
        tipo:             data.tipo             || 'materiais',
        descricao:        data.descricao        || '',
        valor:            data.valor?.toString() || '',
        data_referencia:  data.data_referencia  || '',
        data_vencimento:  data.data_vencimento  || '',
        data_pagamento:   data.data_pagamento   || '',
        status:           data.status           || 'pendente',
        observacoes:      data.observacoes      || '',
        forma_pagamento:  data.forma_pagamento  || '',
        dados_pagamento:  data.dados_pagamento  || '',
      })
      setObras(obrasData || [])
      setCarregando(false)
    })
  }, [id, router])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.valor || parseFloat(form.valor) <= 0) { setErro('Informe um valor válido.'); return }
    setSalvando(true)
    const { error } = await createClient().from('financeiro').update({
      obra_id:          form.obra_id,
      tipo:             form.tipo,
      descricao:        form.descricao,
      valor:            parseFloat(form.valor),
      data_referencia:  form.data_referencia  || null,
      data_vencimento:  form.data_vencimento  || null,
      data_pagamento:   form.data_pagamento   || null,
      status:           form.status,
      observacoes:      form.observacoes      || null,
      forma_pagamento:  form.forma_pagamento  || null,
      dados_pagamento:  form.dados_pagamento  || null,
    }).eq('id', id)
    if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
    router.push('/dashboard/financeiro')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Excluir este lançamento?')) return
    await createClient().from('financeiro').delete().eq('id', id)
    router.push('/dashboard/financeiro')
    router.refresh()
  }

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <>
      <Header titulo="Editar Lançamento" subtitulo="Atualize os dados do lançamento" />
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
                <label className="label">Obra</label>
                <select value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="select">
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
                <label className="label">Descrição</label>
                <input type="text" required value={form.descricao} onChange={e => set('descricao', e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Valor (R$)</label>
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
                <textarea rows={2} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} className="textarea" />
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
                  <textarea
                    rows={3}
                    value={form.dados_pagamento}
                    onChange={e => set('dados_pagamento', e.target.value)}
                    placeholder={DADOS_PLACEHOLDER[form.forma_pagamento] || 'Cole aqui os dados de pagamento...'}
                    className="textarea pr-12"
                  />
                  {form.dados_pagamento && (
                    <button
                      type="button"
                      onClick={copiarDados}
                      title="Copiar"
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg transition-all"
                      style={{ background: copiado ? '#ecfdf5' : '#f1f5f9' }}
                    >
                      {copiado
                        ? <Check className="w-4 h-4 text-emerald-600" />
                        : <Copy className="w-4 h-4 text-lead-400" />
                      }
                    </button>
                  )}
                </div>
                {form.dados_pagamento && (
                  <p className="text-xs text-lead-400 mt-1.5">
                    {copiado ? '✓ Copiado!' : 'Clique no ícone para copiar'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={handleDelete}
              className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
              <Trash2 className="w-4 h-4" />Excluir
            </button>
            <div className="flex gap-3">
              <Link href="/dashboard/financeiro" className="btn-secondary">Cancelar</Link>
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                  : <><Save className="w-4 h-4" />Salvar</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
