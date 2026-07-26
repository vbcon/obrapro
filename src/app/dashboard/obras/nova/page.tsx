'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

const TIPOS = ['residencial','comercial','industrial','reforma','outro']
const FORMAS_PAGAMENTO = ['À vista','Parcelado','Medição mensal','Por etapa','Outro']
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function NovaObraPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('perfis').select('papel').eq('id', user.id).single().then(({ data }) => {
        if (data?.papel && data.papel !== 'admin') router.replace('/dashboard')
      })
    })
  }, [])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: '',
    codigo: '',
    cliente: '',
    tipo: 'comercial',
    descricao: '',
    endereco: '',
    cidade: '',
    estado: 'DF',
    cep: '',
    data_inicio: '',
    data_prevista: '',
    valor_contrato: '',
    orcamento_total: '',
    forma_pagamento: '',
    condicao_pagamento: '',
    anotacoes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.nome || !form.cliente) {
      setErro('Nome da obra e cliente são obrigatórios.')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const codigo = form.codigo || `OBR-${Date.now().toString().slice(-6)}`

    const { error } = await supabase.from('obras').insert({
      nome: form.nome,
      codigo,
      cliente: form.cliente,
      tipo: form.tipo,
      descricao: form.descricao || null,
      endereco: form.endereco || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      cep: form.cep || null,
      data_inicio: form.data_inicio || null,
      data_prevista: form.data_prevista || null,
      orcamento_total: parseFloat(form.orcamento_total) || 0,
      forma_pagamento: form.forma_pagamento || null,
      condicao_pagamento: form.condicao_pagamento || null,
      anotacoes: form.anotacoes || null,
      status: 'planejamento',
      criado_por: user?.id,
    })

    if (error) {
      setErro('Erro ao cadastrar obra. Verifique os dados e tente novamente.')
      setCarregando(false)
      return
    }

    router.push('/dashboard/obras')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Nova Obra" subtitulo="Preencha os dados do projeto" />

      <div className="p-6 max-w-3xl">
        <Link href="/dashboard/obras" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para obras
        </Link>

        {erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Dados básicos */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Dados da Obra</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nome da Obra *</label>
                <input type="text" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Reforma Escritório Centro" className="input" />
              </div>
              <div>
                <label className="label">Código</label>
                <input type="text" value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="Ex: OBR-001 (gerado auto)" className="input" />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="select">
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Cliente *</label>
                <input type="text" required value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nome do cliente ou empresa" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Descrição</label>
                <textarea rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descrição resumida do projeto..." className="input resize-none" />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Localização</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="label">Endereço</label>
                <input type="text" value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Cidade</label>
                <input type="text" value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" className="input" />
              </div>
              <div>
                <label className="label">Estado</label>
                <select value={form.estado} onChange={e => set('estado', e.target.value)} className="select">
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className="label">CEP</label>
                <input type="text" value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" className="input" />
              </div>
            </div>
          </div>

          {/* Prazo */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Prazo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Data de Início</label>
                <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Prazo de Conclusão</label>
                <input type="date" value={form.data_prevista} onChange={e => set('data_prevista', e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="card p-6">
            <h2 className="font-semibold text-lead-900 mb-4">Contrato e Pagamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Valor do Contrato (R$)</label>
                <input type="number" step="0.01" min="0" value={form.orcamento_total} onChange={e => set('orcamento_total', e.target.value)} placeholder="0,00" className="input" />
              </div>
              <div>
                <label className="label">Forma de Pagamento</label>
                <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)} className="select">
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Condições de Pagamento</label>
                <input type="text" value={form.condicao_pagamento} onChange={e => set('condicao_pagamento', e.target.value)} placeholder="Ex: 30% entrada, 40% na metade, 30% na entrega" className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Anotações</label>
                <textarea rows={3} value={form.anotacoes} onChange={e => set('anotacoes', e.target.value)} placeholder="Observações importantes sobre o contrato..." className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/obras" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={carregando} className="btn-primary">
              {carregando ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
              ) : (
                <><Save className="w-4 h-4" />Cadastrar Obra</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
