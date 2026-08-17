'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle, Plus, Trash2, Paperclip, X, File, Download } from 'lucide-react'

interface Item { descricao: string; unidade: string; quantidade: string; valor_unitario: string }

export default function NovaOCDiretaPage() {
  const router = useRouter()
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    obra_id: '',
    data: new Date().toISOString().split('T')[0],
    fornecedor_nome: '',
    fornecedor_contato: '',
    condicao_pagamento: '',
    telefone_cliente: '',
    observacoes: '',
    metodo_pagamento: '' as '' | 'pix' | 'ted' | 'boleto' | 'dinheiro',
    // PIX
    pix_tipo_chave: 'cnpj' as string,
    pix_chave: '',
    pix_nome: '',
    pix_banco: '',
    // TED
    ted_banco: '',
    ted_agencia: '',
    ted_conta: '',
    ted_tipo_conta: 'corrente' as string,
    ted_cnpj_cpf: '',
    ted_nome: '',
  })

  const [itens, setItens] = useState<Item[]>([
    { descricao: '', unidade: 'un', quantidade: '1', valor_unitario: '' }
  ])

  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [solicitacaoSel, setSolicitacaoSel] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('perfis').select('papel').eq('id', user.id).single().then(({ data }) => {
        if (data?.papel && data.papel !== 'admin') { router.replace('/dashboard'); return }
        supabase.from('obras').select('id, nome, codigo').order('nome').then(({ data: obras }) => setObras(obras || []))
      })
    })
  }, [])

  // Carrega solicitações da obra selecionada (com itens para importar)
  useEffect(() => {
    setSolicitacaoSel('')
    if (!form.obra_id) { setSolicitacoes([]); return }
    const supabase = createClient()
    supabase.from('solicitacoes_compra')
      .select('id, titulo, itens, status, criado_em')
      .eq('obra_id', form.obra_id)
      .neq('status', 'cancelada')
      .order('criado_em', { ascending: false })
      .then(({ data }) => setSolicitacoes(data || []))
  }, [form.obra_id])

  function importarSolicitacao() {
    const sol = solicitacoes.find(s => s.id === solicitacaoSel)
    if (!sol || !Array.isArray(sol.itens) || sol.itens.length === 0) return
    const novos: Item[] = sol.itens.map((it: any) => ({
      descricao:      it.descricao || '',
      unidade:        it.unidade || 'un',
      quantidade:     String(it.quantidade ?? '1'),
      valor_unitario: '',
    }))
    // Substitui a lista se só tiver a linha vazia inicial; senão, adiciona ao final
    setItens(prev => {
      const vazia = prev.length === 1 && !prev[0].descricao && !prev[0].valor_unitario
      return vazia ? novos : [...prev, ...novos]
    })
  }

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function setItem(i: number, f: keyof Item, v: string) {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [f]: v } : item))
  }

  function addItem() {
    setItens(prev => [...prev, { descricao: '', unidade: 'un', quantidade: '1', valor_unitario: '' }])
  }

  function removeItem(i: number) {
    setItens(prev => prev.filter((_, idx) => idx !== i))
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

  const total = itens.reduce((acc, item) =>
    acc + (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0), 0)

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id)         { setErro('Selecione uma obra.'); return }
    if (!form.fornecedor_nome) { setErro('Informe o fornecedor.'); return }
    const itensFilled = itens.filter(i => i.descricao && parseFloat(i.quantidade) > 0 && parseFloat(i.valor_unitario) > 0)
    if (itensFilled.length === 0) { setErro('Adicione pelo menos um item com valor.'); return }

    setSalvando(true)
    const supabase = createClient()

    const ano = new Date().getFullYear()
    const { count } = await supabase.from('compras').select('id', { count: 'exact', head: true })
    const num = String((count || 0) + 1).padStart(4, '0')
    const numero = `OC-${ano}-${num}`
    const token = crypto.randomUUID()

    const itensPayload = itensFilled.map(i => ({
      descricao: i.descricao, unidade: i.unidade,
      quantidade: parseFloat(i.quantidade),
      valor_unitario: parseFloat(i.valor_unitario),
      valor_total: parseFloat(i.quantidade) * parseFloat(i.valor_unitario),
    }))

    // Monta dados_pagamento conforme método
    let dados_pagamento: Record<string, string> | null = null
    if (form.metodo_pagamento === 'pix') {
      dados_pagamento = {
        tipo_chave: form.pix_tipo_chave,
        chave:      form.pix_chave,
        nome:       form.pix_nome,
        banco:      form.pix_banco,
      }
    } else if (form.metodo_pagamento === 'ted') {
      dados_pagamento = {
        banco:      form.ted_banco,
        agencia:    form.ted_agencia,
        conta:      form.ted_conta,
        tipo_conta: form.ted_tipo_conta,
        cnpj_cpf:   form.ted_cnpj_cpf,
        nome:       form.ted_nome,
      }
    }

    const { data: oc, error } = await supabase.from('compras').insert({
      obra_id:            form.obra_id,
      tipo:               'direta',
      numero_pedido:      numero,
      status:             'aguardando_aprovacao',
      data_pedido:        form.data,
      fornecedor_nome:    form.fornecedor_nome,
      condicao_pagamento: form.condicao_pagamento || null,
      telefone_cliente:   form.telefone_cliente   || null,
      observacoes:        form.observacoes        || null,
      valor_total:        total,
      itens:              itensPayload,
      desconto:           0,
      token_aprovacao:    token,
      metodo_pagamento:   form.metodo_pagamento   || null,
      dados_pagamento:    dados_pagamento,
    }).select().single()

    if (error) { setErro(`Erro: ${error.message}`); setSalvando(false); return }

    // Upload em paralelo — erros individuais não bloqueiam o redirecionamento
    if (pendingFiles.length > 0) {
      await Promise.all(pendingFiles.map(async (file) => {
        try {
          const safeName = file.name.replace(/\s+/g, '_')
          const path = `${form.obra_id}/${oc.id}/anexos/${Date.now()}-${safeName}`
          const { error: upErr } = await supabase.storage
            .from('documentos').upload(path, file, { cacheControl: '3600', upsert: false })
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
            await supabase.from('anexos_compra').insert({
              compra_id: oc.id,
              obra_id:   form.obra_id,
              nome:      file.name,
              url:       urlData?.publicUrl,
              tamanho:   file.size,
            })
          }
        } catch { /* ignora erros individuais de upload */ }
      }))
    }

    router.push(`/dashboard/compras/oc/${oc.id}`)
    router.refresh()
  }

  return (
    <>
      <Header titulo="Nova O.C. Direta" subtitulo="Ordem de compra para aprovação do cliente" />

      <div className="page-body max-w-3xl">
        <Link href="/dashboard/compras"
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

          {/* Identificação */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="select">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" value={form.data} onChange={e => set('data', e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Fornecedor */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Fornecedor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome do fornecedor *</label>
                <input type="text" required value={form.fornecedor_nome}
                  onChange={e => set('fornecedor_nome', e.target.value)}
                  placeholder="Ex: Leroy Merlin, Depósito Central..."
                  className="input" />
              </div>
              <div>
                <label className="label">Contato / WhatsApp do fornecedor</label>
                <input type="text" value={form.fornecedor_contato}
                  onChange={e => set('fornecedor_contato', e.target.value)}
                  placeholder="(11) 9 9999-9999" className="input" />
              </div>
              <div>
                <label className="label">Condição de pagamento</label>
                <input type="text" value={form.condicao_pagamento}
                  onChange={e => set('condicao_pagamento', e.target.value)}
                  placeholder="Ex: À vista, 30/60 dias..." className="input" />
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lead-900">Aprovação do cliente</h2>
              <p className="text-xs text-lead-400 mt-0.5">Após criar, você poderá enviar o link de aprovação via WhatsApp</p>
            </div>
            <div>
              <label className="label">
                WhatsApp do cliente
                <span className="label-hint">com DDD, sem espaços — ex: 61999998888</span>
              </label>
              <input type="text" value={form.telefone_cliente}
                onChange={e => set('telefone_cliente', e.target.value.replace(/\D/g, ''))}
                placeholder="61999998888" className="input" maxLength={13} />
            </div>
          </div>

          {/* Itens */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lead-900">Itens</h2>
              <button type="button" onClick={addItem} className="btn-ghost text-sm py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />Adicionar item
              </button>
            </div>

            {/* Importar de solicitação */}
            {form.obra_id && solicitacoes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mb-4 p-3 rounded-lg bg-brand-50/60 border border-brand-100">
                <div className="flex-1">
                  <label className="label text-xs flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-brand-500" />
                    Importar itens de uma solicitação
                  </label>
                  <select value={solicitacaoSel} onChange={e => setSolicitacaoSel(e.target.value)} className="select text-sm">
                    <option value="">Selecione uma solicitação...</option>
                    {solicitacoes.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.titulo} ({Array.isArray(s.itens) ? s.itens.length : 0} {Array.isArray(s.itens) && s.itens.length === 1 ? 'item' : 'itens'})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={importarSolicitacao} disabled={!solicitacaoSel}
                  className="btn-secondary btn-sm disabled:opacity-40 shrink-0">
                  <Download className="w-3.5 h-3.5" />Importar itens
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-semibold text-lead-500 uppercase px-1">
                <span className="col-span-5">Descrição</span>
                <span className="col-span-2">Unidade</span>
                <span className="col-span-2 text-right">Qtd</span>
                <span className="col-span-2 text-right">Valor unit.</span>
                <span className="col-span-1"></span>
              </div>

              {itens.map((item, i) => {
                const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0)
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" value={item.descricao} onChange={e => setItem(i, 'descricao', e.target.value)}
                      placeholder="Material / serviço" className="input col-span-12 sm:col-span-5 text-sm" />
                    <input type="text" value={item.unidade} onChange={e => setItem(i, 'unidade', e.target.value)}
                      placeholder="un" className="input col-span-3 sm:col-span-2 text-sm text-center" />
                    <input type="number" min="0" step="0.01" value={item.quantidade}
                      onChange={e => setItem(i, 'quantidade', e.target.value)}
                      className="input col-span-3 sm:col-span-2 text-sm text-right" />
                    <input type="number" min="0" step="0.01" value={item.valor_unitario}
                      onChange={e => setItem(i, 'valor_unitario', e.target.value)}
                      placeholder="0,00" className="input col-span-5 sm:col-span-2 text-sm text-right" />
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {subtotal > 0 && <span className="text-xs text-lead-500 hidden sm:block">{fmt(subtotal)}</span>}
                      <button type="button" onClick={() => removeItem(i)} disabled={itens.length === 1}
                        className="p-1.5 text-lead-300 hover:text-red-500 disabled:opacity-30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-lead-100 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-lead-500">Total geral</p>
                <p className="text-2xl font-bold text-brand-600">{fmt(total)}</p>
              </div>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lead-900">Dados para pagamento</h2>
              <p className="text-xs text-lead-400 mt-0.5">Exibido para o cliente após a aprovação (exceto boleto)</p>
            </div>

            <div>
              <label className="label">Forma de pagamento</label>
              <select
                value={form.metodo_pagamento}
                onChange={e => set('metodo_pagamento', e.target.value)}
                className="select"
              >
                <option value="">Não informar</option>
                <option value="pix">PIX</option>
                <option value="ted">Transferência (TED)</option>
                <option value="boleto">Boleto</option>
                <option value="dinheiro">Dinheiro / Espécie</option>
              </select>
            </div>

            {/* PIX */}
            {form.metodo_pagamento === 'pix' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-lead-100">
                <div>
                  <label className="label">Tipo de chave PIX</label>
                  <select value={form.pix_tipo_chave} onChange={e => set('pix_tipo_chave', e.target.value)} className="select">
                    <option value="cnpj">CNPJ</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave aleatória</option>
                  </select>
                </div>
                <div>
                  <label className="label">Chave PIX *</label>
                  <input type="text" required={form.metodo_pagamento === 'pix'} value={form.pix_chave}
                    onChange={e => set('pix_chave', e.target.value)}
                    placeholder="Ex: 12.345.678/0001-99" className="input" />
                </div>
                <div>
                  <label className="label">Nome do favorecido</label>
                  <input type="text" value={form.pix_nome}
                    onChange={e => set('pix_nome', e.target.value)}
                    placeholder="VBCON Engenharia LTDA" className="input" />
                </div>
                <div>
                  <label className="label">Banco</label>
                  <input type="text" value={form.pix_banco}
                    onChange={e => set('pix_banco', e.target.value)}
                    placeholder="Ex: Nubank, Itaú..." className="input" />
                </div>
              </div>
            )}

            {/* TED */}
            {form.metodo_pagamento === 'ted' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-lead-100">
                <div>
                  <label className="label">Banco *</label>
                  <input type="text" required={form.metodo_pagamento === 'ted'} value={form.ted_banco}
                    onChange={e => set('ted_banco', e.target.value)}
                    placeholder="Ex: Itaú, Bradesco..." className="input" />
                </div>
                <div>
                  <label className="label">Agência</label>
                  <input type="text" value={form.ted_agencia}
                    onChange={e => set('ted_agencia', e.target.value)}
                    placeholder="0001" className="input" />
                </div>
                <div>
                  <label className="label">Conta</label>
                  <input type="text" value={form.ted_conta}
                    onChange={e => set('ted_conta', e.target.value)}
                    placeholder="12345-6" className="input" />
                </div>
                <div>
                  <label className="label">Tipo de conta</label>
                  <select value={form.ted_tipo_conta} onChange={e => set('ted_tipo_conta', e.target.value)} className="select">
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </select>
                </div>
                <div>
                  <label className="label">CNPJ / CPF</label>
                  <input type="text" value={form.ted_cnpj_cpf}
                    onChange={e => set('ted_cnpj_cpf', e.target.value)}
                    placeholder="12.345.678/0001-99" className="input" />
                </div>
                <div>
                  <label className="label">Nome do favorecido</label>
                  <input type="text" value={form.ted_nome}
                    onChange={e => set('ted_nome', e.target.value)}
                    placeholder="VBCON Engenharia LTDA" className="input" />
                </div>
              </div>
            )}

            {/* Boleto */}
            {form.metodo_pagamento === 'boleto' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
                O boleto será enviado separadamente ao cliente após a aprovação.
              </div>
            )}

            {/* Dinheiro */}
            {form.metodo_pagamento === 'dinheiro' && (
              <div className="rounded-lg bg-lead-50 border border-lead-200 p-4 text-sm text-lead-600">
                O cliente será orientado a efetuar o pagamento em espécie.
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-3">Observações</h2>
            <textarea rows={3} value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
              placeholder="Instruções de entrega, condições especiais..."
              className="textarea" />
          </div>

          {/* Anexos */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lead-900">Anexos</h2>
                <p className="text-xs text-lead-400 mt-0.5">Cotações, propostas e documentos do fornecedor</p>
              </div>
              <label className="btn-ghost text-sm py-1.5 px-3 cursor-pointer">
                <Paperclip className="w-3.5 h-3.5" />Anexar arquivo
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  className="sr-only"
                  onChange={addFiles}
                />
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

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/compras" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{pendingFiles.length > 0 ? 'Salvando e enviando arquivos...' : 'Gerando O.C...'}</>
                : <><Save className="w-4 h-4" />Gerar Ordem de Compra</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
