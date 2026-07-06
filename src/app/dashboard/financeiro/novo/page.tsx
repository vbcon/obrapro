'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

const TIPOS = ['medicao','pagamento','adiantamento','retencao','multa']
const TIPO_LABELS: Record<string, string> = { medicao: 'Medição', pagamento: 'Pagamento', adiantamento: 'Adiantamento', retencao: 'Retenção', multa: 'Multa' }

export default function NovoLancamentoPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [obras, setObras] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [form, setForm] = useState({
    obra_id: '', tipo: 'medicao', descricao: '', valor: '',
    data_referencia: new Date().toISOString().split('T')[0],
    data_vencimento: '', data_pagamento: '', status: 'pendente', observacoes: '',
  })

  useEffect(() => {
    createClient().from('obras').select('id, nome, codigo').order('nome').then(({ data }) => setObras(data || []))
  }, [])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!form.obra_id) { setErro('Selecione uma obra.'); return }
    if (!form.valor || parseFloat(form.valor) <= 0) { setErro('Informe um valor válido.'); return }
    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('financeiro').insert({
      obra_id: form.obra_id,
      tipo: form.tipo,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data_referencia: form.data_referencia,
      data_vencimento: form.data_vencimento || null,
      data_pagamento: form.data_pagamento || null,
      status: form.status,
      observacoes: form.observacoes || null,
      criado_por: user?.id,
    })
    if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
    router.push('/dashboard/financeiro')
    router.refresh()
  }

  return (
    <>
      <Header titulo="Novo Lançamento" subtitulo="Registre uma medição ou pagamento" />
      <div className="p-6 max-w-2xl">
        <Link href="/dashboard/financeiro" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 mb-6"><ArrowLeft className="w-4 h-4" />Voltar</Link>

        {erro && <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6"><AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><p className="text-red-700 text-sm">{erro}</p></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lead-900">Dados do Lançamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Obra *</label>
                <select required value={form.obra_id} onChange={e => set('obra_id', e.target.value)} className="input">
                  <option value="">Selecione a obra...</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Descrição *</label>
                <input type="text" required value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Medição nº 3, Pagamento parcela 1..." className="input" />
              </div>
              <div>
                <label className="label">Valor (R$) *</label>
                <input type="number" required step="0.01" min="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} className="input" />
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
                <textarea rows={2} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} className="input resize-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/dashboard/financeiro" className="btn-secondary">Cancelar</Link>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</> : <><Save className="w-4 h-4" />Salvar</>}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
