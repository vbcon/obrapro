import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, Camera, ShoppingCart, Pencil } from 'lucide-react'
import ProjetosSection from '@/components/obras/ProjetosSection'

const statusConfig: Record<string, { label: string; color: string }> = {
  planejamento:  { label: 'Planejamento',  color: 'bg-blue-100 text-blue-700' },
  em_andamento:  { label: 'Em andamento',  color: 'bg-green-100 text-green-700' },
  pausada:       { label: 'Pausada',       color: 'bg-yellow-100 text-yellow-700' },
  concluida:     { label: 'Concluída',     color: 'bg-lead-100 text-lead-600' },
  cancelada:     { label: 'Cancelada',     color: 'bg-red-100 text-red-700' },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default async function ObraDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const [{ data: obra }, { data: arquivos }] = await Promise.all([
    supabase.from('obras').select('*').eq('id', params.id).single(),
    supabase.from('obra_arquivos').select('*').eq('obra_id', params.id).order('criado_em', { ascending: false }),
  ])

  if (!obra) notFound()

  const cfg = statusConfig[obra.status] || statusConfig.planejamento

  return (
    <>
      <Header titulo={obra.nome} subtitulo={`${obra.codigo} · ${obra.cliente}`} />

      <div className="p-6 max-w-4xl space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/obras" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <span className={`badge ${cfg.color}`}>{cfg.label}</span>
            <Link href={`/dashboard/obras/${obra.id}/editar`} className="btn-secondary py-1.5 px-3 text-sm">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Link>
          </div>
        </div>

        {/* Progresso */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-lead-700">Progresso geral</span>
            <span className="text-sm font-bold text-brand-600">{obra.percentual_conclusao}%</span>
          </div>
          <div className="w-full bg-lead-100 rounded-full h-3">
            <div className="h-3 rounded-full bg-brand-500 transition-all" style={{ width: `${obra.percentual_conclusao}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Dados da obra */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-lead-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" />
              Dados da Obra
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Código', obra.codigo],
                ['Cliente', obra.cliente],
                ['Tipo', obra.tipo],
                ['Descrição', obra.descricao || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-lead-500 w-24 shrink-0">{k}</dt>
                  <dd className="font-medium text-lead-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Localização */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-lead-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              Localização
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Endereço', obra.endereco || '—'],
                ['Cidade', obra.cidade || '—'],
                ['Estado', obra.estado || '—'],
                ['CEP', obra.cep || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-lead-500 w-24 shrink-0">{k}</dt>
                  <dd className="font-medium text-lead-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Prazo */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-lead-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              Prazo
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Início', obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : '—'],
                ['Previsão', obra.data_prevista ? new Date(obra.data_prevista).toLocaleDateString('pt-BR') : '—'],
                ['Conclusão', obra.data_conclusao ? new Date(obra.data_conclusao).toLocaleDateString('pt-BR') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-lead-500 w-24 shrink-0">{k}</dt>
                  <dd className="font-medium text-lead-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Financeiro */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-lead-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-500" />
              Contrato
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Valor', formatCurrency(obra.orcamento_total || 0)],
                ['Custo atual', formatCurrency(obra.custo_atual || 0)],
                ['Pagamento', obra.forma_pagamento || '—'],
                ['Condições', obra.condicao_pagamento || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-lead-500 w-24 shrink-0">{k}</dt>
                  <dd className="font-medium text-lead-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Projetos e Arquivos */}
        <ProjetosSection obraId={obra.id} arquivosIniciais={arquivos || []} />

        {/* Ações rápidas */}
        <div className="card p-5">
          <h3 className="font-semibold text-lead-900 mb-4">Ações</h3>
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/diario/nova?obra=${obra.id}`} className="btn-secondary">
              <Camera className="w-4 h-4" />
              Novo Status
            </Link>
            <Link href={`/dashboard/compras/nova?obra=${obra.id}`} className="btn-secondary">
              <ShoppingCart className="w-4 h-4" />
              Nova Solicitação
            </Link>
          </div>
        </div>

        {obra.anotacoes && (
          <div className="card p-5">
            <h3 className="font-semibold text-lead-900 mb-2">Anotações</h3>
            <p className="text-sm text-lead-600 whitespace-pre-wrap">{obra.anotacoes}</p>
          </div>
        )}
      </div>
    </>
  )
}
