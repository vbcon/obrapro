import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { DollarSign, Plus, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

const tipoConfig: Record<string, { label: string; color: string; sinal: string }> = {
  medicao:     { label: 'Medição',      color: 'bg-blue-50 text-blue-700',   sinal: '+' },
  pagamento:   { label: 'Pagamento',    color: 'bg-green-50 text-green-700', sinal: '+' },
  adiantamento:{ label: 'Adiantamento', color: 'bg-brand-50 text-brand-700', sinal: '+' },
  retencao:    { label: 'Retenção',     color: 'bg-yellow-50 text-yellow-700', sinal: '-' },
  multa:       { label: 'Multa',        color: 'bg-red-50 text-red-700',     sinal: '-' },
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pendente:  { label: 'Pendente',  icon: Clock,         color: 'text-yellow-600' },
  pago:      { label: 'Pago',      icon: CheckCircle2,  color: 'text-green-600' },
  atrasado:  { label: 'Atrasado',  icon: AlertTriangle, color: 'text-red-600' },
  cancelado: { label: 'Cancelado', icon: TrendingDown,  color: 'text-lead-400' },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const { data: lancamentos } = await supabase
    .from('financeiro')
    .select('*, obras(nome, codigo)')
    .order('data_referencia', { ascending: false })

  const lista = lancamentos || []

  const totalPago = lista.filter((l: any) => l.status === 'pago').reduce((acc: number, l: any) => acc + l.valor, 0)
  const totalPendente = lista.filter((l: any) => l.status === 'pendente').reduce((acc: number, l: any) => acc + l.valor, 0)
  const totalAtrasado = lista.filter((l: any) => l.status === 'atrasado').reduce((acc: number, l: any) => acc + l.valor, 0)

  return (
    <>
      <Header titulo="Financeiro" subtitulo="Medições e pagamentos das obras" />

      <div className="p-6 space-y-6">

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">Total Recebido</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">A Receber</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(totalPendente)}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-lead-500">Em Atraso</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalAtrasado)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de lançamentos */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-lead-100">
            <h2 className="font-semibold text-lead-900">Lançamentos</h2>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </button>
          </div>

          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <DollarSign className="w-10 h-10 text-lead-300 mb-3" />
              <p className="font-medium text-lead-600">Nenhum lançamento</p>
              <p className="text-sm text-lead-400 mt-1">Registre medições e pagamentos das obras</p>
            </div>
          ) : (
            <div className="divide-y divide-lead-100">
              {lista.map((l: any) => {
                const tipoCfg = tipoConfig[l.tipo] || tipoConfig.pagamento
                const stsCfg = statusConfig[l.status] || statusConfig.pendente
                const StatusIcon = stsCfg.icon
                return (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-lead-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lead-900 truncate">{l.descricao}</p>
                      <p className="text-xs text-lead-500">{l.obras?.codigo} — {l.obras?.nome}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`badge ${tipoCfg.color} hidden sm:inline-flex`}>{tipoCfg.label}</span>
                      <p className="font-bold text-lead-900">
                        <span className={tipoCfg.sinal === '+' ? 'text-green-600' : 'text-red-600'}>{tipoCfg.sinal}</span>
                        {formatCurrency(l.valor)}
                      </p>
                      <StatusIcon className={`w-4 h-4 ${stsCfg.color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
