'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import {
  ArrowLeft, Building2, MapPin, Calendar, Package, DollarSign,
  CheckCircle2, Copy, Check, Printer, Plus, FileText, Receipt,
  AlertCircle, ExternalLink, Banknote, Trash2, X, Upload,
} from 'lucide-react'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

const TIPO_OPTS = [
  { value: 'nota_fiscal', label: 'Nota Fiscal',  icon: FileText  },
  { value: 'boleto',      label: 'Boleto',        icon: Banknote  },
  { value: 'recibo',      label: 'Recibo',        icon: Receipt   },
]
const STATUS_DOC: Record<string, { label: string; cls: string }> = {
  a_pagar:   { label: 'A pagar',  cls: 'badge-yellow'  },
  pago:      { label: 'Pago',     cls: 'badge-green'   },
  vencido:   { label: 'Vencido',  cls: 'badge-red'     },
  cancelado: { label: 'Cancelado',cls: 'badge-neutral' },
}

const docVazio = {
  tipo: 'nota_fiscal', numero_nota: '', descricao: '',
  fornecedor: '', valor: '', data_emissao: '', data_vencimento: '',
}

export default function OcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [oc, setOc]         = useState<any>(null)
  const [cotacao, setCotacao] = useState<any>(null)
  const [docs, setDocs]     = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado]   = useState(false)

  // form novo doc
  const [mostrarForm, setMostrarForm] = useState(false)
  const [docForm, setDocForm] = useState({ ...docVazio })
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvandoDoc, setSalvandoDoc] = useState(false)
  const [erroDoc, setErroDoc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('compras')
        .select('*, obras(nome, codigo, endereco, cidade, estado, cliente), solicitacoes_compra(titulo, itens, data_necessidade)')
        .eq('id', id).single()
      if (!data) { setCarregando(false); return }
      setOc(data)
      if (data.cotacao_id) {
        const { data: cotData } = await supabase.from('cotacoes').select('*').eq('id', data.cotacao_id).single()
        setCotacao(cotData)
      }
      const { data: docsData } = await supabase.from('documentos_compra')
        .select('*').eq('compra_id', id).order('criado_em', { ascending: false })
      setDocs(docsData || [])
      setCarregando(false)
    }
    load()
  }, [id])

  async function copiarNumero() {
    await navigator.clipboard.writeText(oc.numero_pedido)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function setDoc(f: string, v: string) { setDocForm(p => ({ ...p, [f]: v })) }

  async function salvarDoc(e: React.FormEvent) {
    e.preventDefault()
    setErroDoc('')
    if (!docForm.valor) { setErroDoc('Informe o valor.'); return }

    setSalvandoDoc(true)
    let arquivo_url = null, arquivo_nome = null

    if (arquivo) {
      const ext = arquivo.name.split('.').pop()
      const path = `${oc.obra_id}/${id}/${Date.now()}.${ext}`
      const { data: up, error: upErr } = await supabase.storage
        .from('documentos').upload(path, arquivo, { cacheControl: '3600', upsert: false })

      if (upErr) {
        setErroDoc('Erro ao enviar arquivo. O bucket "documentos" precisa ser criado primeiro.')
        setSalvandoDoc(false)
        return
      }
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
      arquivo_url  = urlData?.publicUrl ?? null
      arquivo_nome = arquivo.name
    }

    const { data: novoDoc, error } = await supabase.from('documentos_compra').insert({
      compra_id:       id,
      obra_id:         oc.obra_id,
      tipo:            docForm.tipo,
      numero_nota:     docForm.numero_nota || null,
      descricao:       docForm.descricao || null,
      fornecedor:      docForm.fornecedor || null,
      valor:           parseFloat(docForm.valor.replace(',', '.')) || 0,
      data_emissao:    docForm.data_emissao || null,
      data_vencimento: docForm.data_vencimento || null,
      status:          'a_pagar',
      arquivo_url,
      arquivo_nome,
    }).select().single()

    if (error) { setErroDoc('Erro ao salvar documento.'); setSalvandoDoc(false); return }

    setDocs(prev => [novoDoc, ...prev])
    setDocForm({ ...docVazio })
    setArquivo(null)
    if (fileRef.current) fileRef.current.value = ''
    setMostrarForm(false)
    setSalvandoDoc(false)
  }

  async function togglePago(doc: any) {
    const novoStatus = doc.status === 'pago' ? 'a_pagar' : 'pago'
    const update: any = { status: novoStatus }
    if (novoStatus === 'pago') update.data_pagamento = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('documentos_compra').update(update).eq('id', doc.id)
    if (!error) setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, ...update } : d))
  }

  async function deletarDoc(docId: string) {
    if (!confirm('Excluir este documento?')) return
    await supabase.from('documentos_compra').delete().eq('id', docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )
  if (!oc) return null

  const obra = oc.obras
  const sol  = oc.solicitacoes_compra
  const itens = cotacao?.itens || oc.itens || sol?.itens || []
  const condicaoPagamento = oc.condicao_pagamento || cotacao?.condicao_pagamento
  const totalDocs = docs.reduce((s, d) => s + (Number(d.valor) || 0), 0)
  const totalPago = docs.filter(d => d.status === 'pago').reduce((s, d) => s + (Number(d.valor) || 0), 0)

  return (
    <>
      <Header titulo={`O.C. ${oc.numero_pedido}`} subtitulo="Ordem de Compra" />

      <div className="page-body max-w-3xl">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/compras"
            className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Link>
          <div className="flex items-center gap-2">
            <span className="badge bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3" />Aprovada
            </span>
            <button onClick={() => window.print()} className="btn-ghost py-1.5 px-3 text-sm">
              <Printer className="w-3.5 h-3.5" />Imprimir
            </button>
          </div>
        </div>

        {/* ── Header da OC ── */}
        <div className="card p-6 border-2 border-lead-200">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-lead-500 uppercase tracking-widest mb-1">Ordem de Compra</p>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-lead-900">{oc.numero_pedido}</h1>
                <button onClick={copiarNumero} className="p-1.5 text-lead-400 hover:text-brand-600 transition-colors rounded">
                  {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-lead-500 mt-1">
                Emitida em: {new Date(oc.data_pedido + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-lead-500 mb-1">Valor total</p>
              <p className="text-3xl font-black text-brand-600">{fmt(oc.valor_total || 0)}</p>
              {condicaoPagamento && (
                <p className="text-xs text-lead-500 mt-1">💳 {condicaoPagamento}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Fornecedor + Obra ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="text-xs text-lead-500 uppercase tracking-wide font-semibold mb-2">Fornecedor</p>
            <p className="text-lg font-bold text-lead-900">{oc.fornecedor_nome}</p>
            {cotacao?.fornecedor_contato && <p className="text-sm text-lead-600 mt-1">{cotacao.fornecedor_contato}</p>}
            {cotacao?.aprovado_cliente_nome && (
              <div className="pt-2 border-t border-lead-100 mt-2">
                <p className="text-xs text-lead-500">Aprovado por</p>
                <p className="text-sm font-semibold text-green-700">{cotacao.aprovado_cliente_nome}</p>
                {cotacao.aprovado_cliente_em && (
                  <p className="text-xs text-lead-400">
                    {new Date(cotacao.aprovado_cliente_em).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <p className="text-xs text-lead-500 uppercase tracking-wide font-semibold mb-2">Obra / Entrega</p>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-lead-900">{obra?.nome}</p>
                {obra?.codigo && <p className="text-xs text-lead-500">{obra.codigo}</p>}
              </div>
            </div>
            {(obra?.endereco || obra?.cidade) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-lead-700">{obra.endereco}</p>
                  {(obra.cidade || obra.estado) && (
                    <p className="text-xs text-lead-500">{[obra.cidade, obra.estado].filter(Boolean).join(' - ')}</p>
                  )}
                </div>
              </div>
            )}
            {oc.data_entrega_prevista && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                <p className="text-sm text-lead-700">
                  Entrega: <strong>{fmtDate(oc.data_entrega_prevista)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Referência ── */}
        {sol?.titulo && (
          <div className="card p-4 bg-lead-50">
            <p className="text-xs text-lead-500 mb-0.5">Referência</p>
            <p className="text-sm font-medium text-lead-800">{sol.titulo}</p>
          </div>
        )}

        {/* ── Itens ── */}
        <div className="card p-5">
          <h3 className="font-semibold text-lead-900 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-brand-500" />Itens da Ordem de Compra
          </h3>
          {itens.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-semibold text-lead-500 uppercase tracking-wide">
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-2 text-right">Vl. Unit.</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              {itens.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-2 py-2.5 rounded-lg hover:bg-lead-50 text-sm">
                  <div className="col-span-5">
                    <p className="font-medium text-lead-900">{item.descricao}</p>
                    <p className="text-xs text-lead-500">{item.unidade}</p>
                  </div>
                  <div className="col-span-2 text-center text-lead-700">{item.quantidade}</div>
                  <div className="col-span-2 text-right text-lead-700">
                    {item.valor_unitario > 0 ? fmt(item.valor_unitario) : '—'}
                  </div>
                  <div className="col-span-3 text-right font-semibold text-lead-900">
                    {item.valor_total > 0 ? fmt(item.valor_total) : '—'}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t border-lead-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-lead-700">Total:</span>
                  <span className="text-2xl font-black text-brand-600">{fmt(oc.valor_total || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-lead-400">Itens não disponíveis.</p>
          )}
        </div>

        {oc.observacoes && (
          <div className="card p-5">
            <p className="text-xs text-lead-500 mb-1">Observações</p>
            <p className="text-sm text-lead-700">{oc.observacoes}</p>
          </div>
        )}

        {/* ── DOCUMENTOS FINANCEIROS ──────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="section-header">
            <div>
              <p className="section-title">Documentos Financeiros</p>
              <p className="text-xs text-lead-400 mt-0.5">Notas fiscais, boletos e recibos desta compra</p>
            </div>
            <button
              onClick={() => { setMostrarForm(f => !f); setErroDoc('') }}
              className="btn-primary btn-sm"
            >
              {mostrarForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {mostrarForm ? 'Cancelar' : 'Adicionar documento'}
            </button>
          </div>

          {/* Resumo financeiro docs */}
          {docs.length > 0 && (
            <div className="grid grid-cols-3 gap-0 border-b border-lead-100">
              {[
                { label: 'Total documentado', val: totalDocs, cor: 'text-lead-900' },
                { label: 'Total pago',         val: totalPago,              cor: 'text-emerald-600' },
                { label: 'A pagar',            val: totalDocs - totalPago,  cor: 'text-amber-600' },
              ].map(k => (
                <div key={k.label} className="py-3 px-5 text-center border-r border-lead-100 last:border-r-0">
                  <p className={`text-base font-bold ${k.cor} tabular-nums`}>{fmt(k.val)}</p>
                  <p className="text-xs text-lead-400 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Formulário novo documento */}
          {mostrarForm && (
            <form onSubmit={salvarDoc} className="px-6 py-5 border-b border-lead-100 bg-lead-50/50">
              <h4 className="text-sm font-semibold text-lead-800 mb-4">Novo documento</h4>

              {erroDoc && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-xs">{erroDoc}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select value={docForm.tipo} onChange={e => setDoc('tipo', e.target.value)} className="select">
                    {TIPO_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nº documento</label>
                  <input
                    type="text"
                    value={docForm.numero_nota} onChange={e => setDoc('numero_nota', e.target.value)}
                    placeholder="Ex: 00123"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Valor *</label>
                  <input
                    type="text" required
                    value={docForm.valor} onChange={e => setDoc('valor', e.target.value)}
                    placeholder="0,00"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Data de emissão</label>
                  <input type="date" value={docForm.data_emissao} onChange={e => setDoc('data_emissao', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Vencimento</label>
                  <input type="date" value={docForm.data_vencimento} onChange={e => setDoc('data_vencimento', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Fornecedor</label>
                  <input
                    type="text"
                    value={docForm.fornecedor} onChange={e => setDoc('fornecedor', e.target.value)}
                    placeholder="Razão social ou nome"
                    className="input"
                  />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className="label">Descrição</label>
                  <input
                    type="text"
                    value={docForm.descricao} onChange={e => setDoc('descricao', e.target.value)}
                    placeholder="Breve descrição do documento"
                    className="input"
                  />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className="label">Arquivo <span className="label-hint">PDF, imagem — opcional</span></label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-lead-200 rounded-lg px-3 py-2 hover:border-brand-400 transition-colors">
                    <Upload className="w-4 h-4 text-lead-400 shrink-0" />
                    <span className="text-sm text-lead-500 truncate">
                      {arquivo ? arquivo.name : 'Clique para selecionar...'}
                    </span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="sr-only"
                      onChange={e => setArquivo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button type="submit" disabled={salvandoDoc} className="btn-primary">
                  {salvandoDoc
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                    : <><FileText className="w-4 h-4" />Adicionar</>
                  }
                </button>
              </div>
            </form>
          )}

          {/* Lista de documentos */}
          {docs.length === 0 && !mostrarForm ? (
            <div className="empty-state py-12">
              <div className="empty-state-icon mx-auto">
                <FileText className="w-5 h-5 text-lead-400" />
              </div>
              <p className="text-sm text-lead-500">Nenhum documento anexado ainda.</p>
              <p className="text-xs text-lead-400 mt-1">Adicione notas fiscais, boletos e recibos desta compra.</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100/80">
              {docs.map(doc => {
                const tipoInfo = TIPO_OPTS.find(t => t.value === doc.tipo) || TIPO_OPTS[0]
                const Icon = tipoInfo.icon
                const sts = STATUS_DOC[doc.status] || STATUS_DOC.a_pagar
                const hoje = new Date(); hoje.setHours(0,0,0,0)
                const venc = doc.data_vencimento ? new Date(doc.data_vencimento + 'T00:00:00') : null
                const vencido = doc.status === 'a_pagar' && venc && venc < hoje

                return (
                  <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-lead-50/60 transition-colors group">
                    {/* Icon tipo */}
                    <div className="w-8 h-8 rounded-lg bg-lead-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-lead-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-lead-900 truncate">
                          {tipoInfo.label}
                          {doc.numero_nota && ` #${doc.numero_nota}`}
                        </p>
                        <span className={sts.cls}>{sts.label}</span>
                        {vencido && <span className="badge-red">Vencido</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-lead-400">
                        {doc.descricao && <span>{doc.descricao}</span>}
                        {doc.fornecedor && <span>{doc.fornecedor}</span>}
                        {doc.data_emissao && <span>Emissão: {fmtDate(doc.data_emissao)}</span>}
                        {doc.data_vencimento && <span className={vencido ? 'text-red-500 font-medium' : ''}>
                          Vencimento: {fmtDate(doc.data_vencimento)}
                        </span>}
                        {doc.data_pagamento && <span className="text-emerald-600">Pago em: {fmtDate(doc.data_pagamento)}</span>}
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-lead-900">{fmt(Number(doc.valor) || 0)}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.arquivo_url && (
                        <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-lead-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                          title="Ver arquivo">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => togglePago(doc)}
                        title={doc.status === 'pago' ? 'Marcar como a pagar' : 'Marcar como pago'}
                        className="p-1.5 rounded-md text-lead-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${doc.status === 'pago' ? 'text-emerald-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => deletarDoc(doc.id)}
                        title="Excluir"
                        className="p-1.5 rounded-md text-lead-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {sol && (
          <Link href={`/dashboard/compras/${oc.solicitacao_id}`}
            className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700">
            <ArrowLeft className="w-4 h-4" />Ver solicitação original
          </Link>
        )}
      </div>
    </>
  )
}
